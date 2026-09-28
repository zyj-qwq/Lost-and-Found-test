<!-- ============================================================
HomeView.vue —— 首页（信息列表 + 筛选 + 分页）
============================================================
本页能学到：
  1. 页面的核心套路："数据 → 发请求 → 存起来 → 模板自动渲染"。
     你改的只是 JS 变量（list、query），页面跟着变，不用手动改 DOM。
  2. v-for：列表渲染（相当于循环生成 HTML）。
  3. v-loading / v-if / v-else 的使用。
============================================================ -->

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { get } from '@/api'
import type { Item, ItemQuery, ItemType, PageResult } from '@/types'
import { formatTime, itemStatusMap } from '@/utils/format'
import { Search, Refresh, Location, Clock, User } from '@element-plus/icons-vue'
// 空状态插画。Vite 会把 .svg 变成一个"图片网址字符串"
import emptyImg from '@/assets/empty-box.svg'

const router = useRouter()
const loading = ref(false)      // 是否正在加载（true 时表格上盖转圈动画）
const list = ref<Item[]>([])    // 当前页的信息列表
const total = ref(0)            // 总条数（分页组件用来算总页数）

// 类型切换按钮的"配置数组"。
// 写成 ItemType | '' 的联合类型，赋值给 query.type 时 TS 才不会报错
const typeOptions: { v: ItemType | ''; label: string }[] = [
  { v: '', label: '全部' },
  { v: 'lost', label: '失物' },
  { v: 'found', label: '拾物' }
]

// 每页条数单独存一个常量：
// query.page_size 的类型是可选的（可能 undefined），直接拿去算分页会报类型错，
// 用这个必定有值的常量就干净了
const PAGE_SIZE = 12

// 查询条件。page=1 是第一页；type='' 表示"全部"
// 筛选条件变化时会先把 page 重置为 1（见 handleSearch）
const query = reactive<ItemQuery>({ page: 1, page_size: PAGE_SIZE, type: '', keyword: '', location: '', sort: 'latest' })

// 从后端拉取信息列表
async function fetchList() {
  loading.value = true
  try {
    // 组装请求参数：只在有值时才传（空值不传，后端就不筛选这一项）
    const params: Record<string, unknown> = { page: query.page, page_size: query.page_size, sort: query.sort }
    if (query.type) params.type = query.type
    if (query.keyword) params.keyword = query.keyword
    if (query.location) params.location = query.location
    // 发 GET 请求，返回 { list, total, page, page_size }
    const data = await get<PageResult<Item>>('/items', params)
    list.value = data.list // 把数据存进响应式变量，模板里的卡片列表自动更新
    total.value = data.total
  } finally {
    loading.value = false
  }
}

// 搜索/改筛选条件：永远回到第 1 页再查（否则可能停在一个不存在的页码上）
function handleSearch() {
  query.page = 1
  fetchList()
}

// 重置所有筛选条件
function handleReset() {
  query.type = ''
  query.keyword = ''
  query.location = ''
  query.sort = 'latest'
  query.page = 1
  fetchList()
}

// 点了分页器的某一页：改成那个页码再查（此时不重置，用户就是想看那页）
function handlePageChange(page: number) {
  query.page = page
  fetchList()
  // 翻页后滚回顶部，不然用户会停在页面中间看不到新内容
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 暴露给模板用的小工具：从信息里取第一张图
function coverOf(item: Item) {
  return item.images && item.images.length ? item.images[0] : ''
}

// onMounted：组件加载完成后先查一次（页面打开就自动展示列表）
onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="home">
    <!-- ==================== 页面标题 ==================== -->
    <div class="list-head">
      <h2>失物招领信息</h2>
      <p>捡到东西或丢了东西，都可以在这里发布和查找</p>
    </div>

    <!-- ==================== 筛选面板 ==================== -->
    <section class="filter-panel">
      <div class="filter-top">
        <!-- 分段式类型切换：用自定义按钮而不是 el-radio，外观更好控制 -->
        <div class="segmented">
          <!-- 选项数组写在 script 里（见 typeOptions），模板用 v-for 循环
               （这样能保证 t.v 的类型是 ItemType | ''，不会报类型错误） -->
          <button
            v-for="t in typeOptions"
            :key="t.v"
            class="seg-btn"
            :class="{ on: query.type === t.v }"
            @click="query.type = t.v; handleSearch()"
          >
            {{ t.label }}
          </button>
        </div>

        <div class="filter-fields">
          <el-input
            v-model="query.keyword"
            placeholder="搜索标题 / 描述"
            clearable
            :prefix-icon="Search"
            class="fld"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <el-input
            v-model="query.location"
            placeholder="地点（如：图书馆）"
            clearable
            :prefix-icon="Location"
            class="fld"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" text @click="handleReset">重置</el-button>
        </div>
      </div>

      <!-- 当前筛选结果的说明行 -->
      <div class="filter-summary">
        <span>
          共找到 <b>{{ total }}</b> 条信息
          <template v-if="query.keyword"> · 关键词「{{ query.keyword }}」</template>
          <template v-if="query.location"> · 地点「{{ query.location }}」</template>
        </span>
      </div>
    </section>

    <!-- ==================== 列表 ==================== -->
    <!-- v-loading：loading 为 true 时整块内容盖上一层转圈动画 -->
    <div v-loading="loading" class="list-wrap">
      <!-- 没数据时显示插画空状态（:image 换成我们自己画的图） -->
      <el-empty v-if="!loading && list.length === 0" :image="emptyImg" :image-size="180" description="这里还空空如也，换个条件试试？" />

      <!-- 有数据时：el-row/el-col 是栅格布局（类似 Bootstrap），
           :xs/:sm/:md/:lg 分别是手机/平板/电脑屏幕下每项占几格（共 24 格） -->
      <el-row v-else :gutter="18">
        <!-- v-for：循环 list 数组，每条信息生成一张卡片；:key 帮 Vue 高效更新列表 -->
        <el-col v-for="(item, idx) in list" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6">
          <!-- @click：点卡片跳到详情页；模板字符串拼出 /items/1 这样的网址 -->
          <!-- :style 给每张卡加一点点"依次出现"的延迟，看起来更灵动 -->
          <article class="item-card" :style="{ animationDelay: `${Math.min(idx, 8) * 55}ms` }" @click="router.push(`/items/${item.id}`)">
            <div class="card-media">
              <!-- 三元表达式决定显示图片还是占位符；v-if / v-else 成对出现 -->
              <img v-if="coverOf(item)" :src="coverOf(item)" :alt="item.title" loading="lazy" />
              <div v-else class="media-placeholder">
                <svg viewBox="0 0 64 64" fill="none">
                  <rect x="10" y="14" width="44" height="36" rx="6" stroke="currentColor" stroke-width="3" />
                  <circle cx="24" cy="27" r="4" fill="currentColor" />
                  <path d="M12 44 L25 32 L34 40 L43 31 L52 40 L52 44 Z" fill="currentColor" fill-opacity="0.55" />
                </svg>
                <span>暂无图片</span>
              </div>
              <!-- 左上角的"失物/拾物"角标，失物红色、拾物绿色 -->
              <span class="type-pill" :class="item.type === 'lost' ? 'is-lost' : 'is-found'">
                {{ item.type === 'lost' ? '失物' : '拾物' }}
              </span>
            </div>

            <div class="card-body">
              <h3 class="card-title">{{ item.title }}</h3>

              <div class="card-info">
                <span class="info-row">
                  <el-icon><Location /></el-icon>
                  <i class="pf-ellipsis">{{ item.location || '未填写地点' }}</i>
                </span>
                <span class="info-row">
                  <el-icon><Clock /></el-icon>
                  <i>{{ formatTime(item.lost_at) }}</i>
                </span>
              </div>

              <div class="card-foot">
                <!-- 状态标签：文案和颜色从 itemStatusMap 里查表得到 -->
                <el-tag size="small" effect="light" round :type="itemStatusMap[item.status]?.type">
                  {{ itemStatusMap[item.status]?.label }}
                </el-tag>
                <span class="publisher">
                  <el-icon><User /></el-icon>{{ item.user?.username || '匿名' }}
                </span>
              </div>
            </div>
          </article>
        </el-col>
      </el-row>
    </div>

    <!-- 分页器：total 总条数；@current-change 用户点某页时触发 -->
    <div class="pager" v-if="total > PAGE_SIZE">
      <el-pagination
        background
        layout="prev, pager, next, total"
        :total="total"
        :page-size="PAGE_SIZE"
        :current-page="query.page"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
/* ==================== 页面标题 ==================== */
.list-head {
  padding: 4px 2px 16px;
}
.list-head h2 {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-1);
  letter-spacing: -0.3px;
}
.list-head p {
  margin: 0;
  font-size: 13.5px;
  color: var(--text-4);
}

/* ==================== 筛选面板 ==================== */
.filter-panel {
  position: relative;
  z-index: 2;
  background: #fff;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-base);
  box-shadow: var(--shadow-md);
  margin: 0 0 22px;
  padding: 16px 20px 12px;
  animation: pf-rise 0.55s 0.08s var(--ease-out) both;
}
.filter-top {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

/* 分段控件：外层灰底，选中的那块是白底+阴影，像 iOS 的切换器 */
.segmented {
  display: inline-flex;
  background: var(--bg-soft);
  border-radius: var(--radius-md);
  padding: 4px;
  gap: 2px;
  flex-shrink: 0;
}
.seg-btn {
  border: none;
  background: transparent;
  padding: 7px 20px;
  border-radius: var(--radius-sm);
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-3);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.18s var(--ease-out);
}
.seg-btn:hover {
  color: var(--brand-500);
}
.seg-btn.on {
  background: #fff;
  color: var(--brand-600);
  font-weight: 600;
  box-shadow: var(--shadow-xs);
}

.filter-fields {
  display: flex;
  gap: 10px;
  align-items: center;
  flex: 1;
  flex-wrap: wrap;
}
.fld {
  width: 190px;
}

.filter-summary {
  margin-top: 12px;
  padding-top: 11px;
  border-top: 1px dashed var(--border-base);
  font-size: 13px;
  color: var(--text-3);
}
.filter-summary b {
  color: var(--brand-600);
  font-size: 15px;
}

/* ==================== 卡片列表 ==================== */
.list-wrap {
  min-height: 260px;
}

.item-card {
  background: #fff;
  border: 1px solid var(--border-base);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  margin-bottom: 18px;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.28s var(--ease-out), box-shadow 0.28s var(--ease-out), border-color 0.28s;
  animation: pf-rise 0.5s var(--ease-out) both;
}
.item-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-lg);
  border-color: var(--brand-200);
}

.card-media {
  position: relative;
  height: 158px;
  background: var(--grad-soft);
  overflow: hidden;
}
.card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.5s var(--ease-out);
}
/* 鼠标悬停时图片轻微放大，是卡片类交互最常用的"呼吸感" */
.item-card:hover .card-media img {
  transform: scale(1.06);
}
.media-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #b9c6dd;
  font-size: 12.5px;
}
.media-placeholder svg {
  width: 46px;
  height: 46px;
}

.type-pill {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 12px;
  border-radius: var(--radius-full);
  color: #fff;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}
.type-pill.is-lost {
  background: rgba(240, 74, 94, 0.92);
}
.type-pill.is-found {
  background: rgba(18, 184, 134, 0.92);
}

.card-body {
  padding: 13px 15px 14px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.card-title {
  font-size: 15.5px;
  font-weight: 600;
  color: var(--text-1);
  margin: 0 0 9px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}
.info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text-3);
  min-width: 0;
}
.info-row .el-icon {
  color: var(--text-4);
  flex-shrink: 0;
  font-size: 13px;
}
.info-row i {
  font-style: normal;
  min-width: 0;
}

.card-foot {
  margin-top: auto;
  padding-top: 11px;
  border-top: 1px solid var(--border-base);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.publisher {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-4);
}

.pager {
  display: flex;
  justify-content: center;
  padding: 16px 0 8px;
}

/* ==================== 响应式 ==================== */
@media (max-width: 900px) {
  .list-head h2 {
    font-size: 19px;
  }
  .fld {
    width: 100%;
  }
  .filter-fields {
    width: 100%;
  }
}
@media (max-width: 560px) {
  .segmented {
    width: 100%;
  }
  .seg-btn {
    flex: 1;
    padding: 7px 8px;
  }
}
</style>
