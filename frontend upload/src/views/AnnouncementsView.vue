<!-- ============================================================
AnnouncementsView.vue —— 公告列表（手风琴折叠面板）
============================================================
最简单的一个页面：进页面 → 拉公告 → 折叠面板展示。
el-collapse：折叠面板，点标题展开/收起；accordion=同时间只展开一个。

【本次改版说明】
  原来公告项是"一行标题 + 一行时间"，展开后一片灰字，比较单调。
  现在每一条公告做成独立的小卡片，展开时有更好的阅读排版，
  并给每条加了个序号徽标，看起来更有"通知栏"的感觉。
============================================================ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get } from '@/api'
import type { Announcement, PageResult } from '@/types'
import { formatTime } from '@/utils/format'
import { Bell } from '@element-plus/icons-vue'
import emptyImg from '@/assets/empty-box.svg'

const loading = ref(false)
const list = ref<Announcement[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 10 // 每页固定 10 条，不需要用户改，所以用普通常量

async function fetchList() {
  loading.value = true
  try {
    const data = await get<PageResult<Announcement>>('/announcements', { page: page.value, page_size: pageSize })
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

// 翻页
function handlePageChange(p: number) {
  page.value = p
  fetchList()
}

onMounted(fetchList) // 页面打开自动加载
</script>

<template>
  <div class="announcements pf-rise">
    <!-- 页头 -->
    <header class="page-head">
      <h1 class="pf-page-title">平台公告</h1>
      <p class="head-sub">平台规则变更、活动通知、系统维护等信息都会在这里发布。</p>
    </header>

    <div class="ann-card">
      <div v-loading="loading">
        <!-- 空状态用我们自己画的插画 -->
        <el-empty v-if="!loading && list.length === 0" :image="emptyImg" :image-size="170"
          description="暂时还没有发布公告" />

        <!-- v-else：有公告才显示折叠面板。accordion=手风琴模式 -->
        <el-collapse v-else accordion class="ann-list">
          <!-- :name="ann.id"：每项的唯一标识，点谁展开谁 -->
          <el-collapse-item v-for="(ann, i) in list" :key="ann.id" :name="ann.id">
            <!-- #title：折叠面板"标题行"的插槽，自定义标题排版 -->
            <template #title>
              <div class="ann-title">
                <!-- 左边的序号徽标，让列表有"通知流"的感觉 -->
                <span class="ann-index">{{ String(i + 1).padStart(2, '0') }}</span>
                <span class="ann-name">{{ ann.title }}</span>
                <span class="ann-time">
                  <el-icon><Bell /></el-icon>{{ formatTime(ann.created_at) }}
                </span>
              </div>
            </template>
            <!-- 展开后显示的内容 -->
            <div class="ann-body">
              <p class="ann-content">{{ ann.content }}</p>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>

      <div class="pf-pager" v-if="total > pageSize">
        <el-pagination background layout="prev, pager, next, total" :total="total" :page-size="pageSize"
          :current-page="page" @current-change="handlePageChange" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-head {
  margin-bottom: 18px;
}
.head-sub {
  margin: 8px 0 0;
  font-size: 13.5px;
  color: var(--text-3);
  line-height: 1.7;
}

.ann-card {
  background: #fff;
  border: 1px solid var(--border-base);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 8px 20px 18px;
}

/* ---------------- 折叠面板微调 ---------------- */
.ann-list {
  border-top: none;
  border-bottom: none;
}
.ann-list :deep(.el-collapse-item__header) {
  height: auto;
  min-height: 62px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-base);
  font-size: 14.5px;
  line-height: 1.5;
  transition: background 0.2s;
}
.ann-list :deep(.el-collapse-item__header:hover) {
  background: var(--bg-soft);
}
.ann-list :deep(.el-collapse-item__wrap) {
  border-bottom: 1px solid var(--border-base);
  background: #fff;
}
.ann-list :deep(.el-collapse-item__content) {
  padding-bottom: 14px;
}

.ann-title {
  display: flex;
  align-items: center;
  gap: 13px;
  width: 100%;
  padding-right: 12px;
  min-width: 0;
}

/* 序号徽标：渐变底 + 等宽数字，看起来更整齐 */
.ann-index {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: var(--grad-brand);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  font-family: 'SFMono-Regular', Consolas, monospace;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 10px rgba(43, 127, 228, 0.25);
}

.ann-name {
  font-weight: 600;
  color: var(--text-1);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ann-time {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--text-4);
  font-size: 12px;
  font-weight: 400;
  flex-shrink: 0;
}
.ann-time .el-icon {
  font-size: 13px;
}

/* 展开后的正文 */
.ann-body {
  padding: 4px 2px 2px 43px; /* 左边留出和序号对齐的缩进 */
}
.ann-content {
  margin: 0;
  white-space: pre-wrap; /* 保留后端内容里的换行 */
  color: var(--text-2);
  line-height: 1.9;
  font-size: 14px;
}

@media (max-width: 640px) {
  .ann-card {
    padding: 4px 14px 14px;
  }
  .ann-body {
    padding-left: 0;
  }
  /* 手机上时间挪到标题下方不太好做，直接隐藏，靠展开后的内容看时间 */
  .ann-time {
    display: none;
  }
}
</style>
