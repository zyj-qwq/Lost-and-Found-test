<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { get } from '@/api'
import type { Item, ItemQuery, PageResult } from '@/types'
import { formatTime, itemStatusMap } from '@/utils/format'
import { Search } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const list = ref<Item[]>([])
const total = ref(0)

const query = reactive<ItemQuery>({ page: 1, page_size: 12, type: '', keyword: '', location: '', sort: 'latest' })

async function fetchList() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: query.page, page_size: query.page_size, sort: query.sort }
    if (query.type) params.type = query.type
    if (query.keyword) params.keyword = query.keyword
    if (query.location) params.location = query.location
    const data = await get<PageResult<Item>>('/items', params)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  fetchList()
}

function handlePageChange(page: number) {
  query.page = page
  fetchList()
}

onMounted(fetchList)
</script>

<template>
  <div class="home">
    <div class="hero">
      <h1>校园失物招领平台</h1>
      <p>丢失了物品？捡到了东西？在这里发布和查找，让失物尽快回家。</p>
    </div>

    <el-card shadow="never" class="filter-card">
      <div class="filter-bar">
        <el-radio-group v-model="query.type" @change="handleSearch">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="lost">失物</el-radio-button>
          <el-radio-button value="found">拾物</el-radio-button>
        </el-radio-group>
        <el-input v-model="query.keyword" placeholder="搜索标题 / 描述" clearable class="w200"
          @keyup.enter="handleSearch" @clear="handleSearch" />
        <el-input v-model="query.location" placeholder="地点筛选（如：图书馆）" clearable class="w200"
          @keyup.enter="handleSearch" @clear="handleSearch" />
        <el-select v-model="query.sort" class="w140" @change="handleSearch">
          <el-option label="最新发布" value="latest" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
      </div>
    </el-card>

    <div v-loading="loading">
      <el-empty v-if="!loading && list.length === 0" description="暂无相关信息" />
      <el-row :gutter="16" v-else>
        <el-col v-for="item in list" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6">
          <el-card shadow="hover" class="item-card" @click="router.push(`/items/${item.id}`)">
            <div class="img-wrap">
              <img v-if="item.images && item.images.length" :src="item.images[0]" alt="" />
              <div v-else class="img-placeholder">暂无图片</div>
              <el-tag class="type-tag" :type="item.type === 'lost' ? 'danger' : 'success'" effect="dark">
                {{ item.type === 'lost' ? '失物' : '拾物' }}
              </el-tag>
            </div>
            <div class="item-body">
              <div class="item-title">{{ item.title }}</div>
              <div class="item-meta">📍 {{ item.location }}</div>
              <div class="item-meta">🕒 {{ formatTime(item.lost_at) }}</div>
              <div class="item-footer">
                <el-tag size="small" :type="itemStatusMap[item.status]?.type">
                  {{ itemStatusMap[item.status]?.label }}
                </el-tag>
                <span class="publisher">{{ item.user?.username }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="pager" v-if="total > 0">
      <el-pagination background layout="prev, pager, next, total" :total="total"
        :page-size="query.page_size" :current-page="query.page" @current-change="handlePageChange" />
    </div>
  </div>
</template>

<style scoped>
.hero { text-align: center; padding: 28px 0 20px; }
.hero h1 { margin: 0; font-size: 28px; }
.hero p { color: #909399; margin: 10px 0 0; }
.filter-card { margin-bottom: 16px; }
.filter-bar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.w200 { width: 200px; }
.w140 { width: 140px; }
.item-card { margin-bottom: 16px; cursor: pointer; transition: transform 0.2s; }
.item-card:hover { transform: translateY(-3px); }
.img-wrap { position: relative; height: 150px; border-radius: 6px; overflow: hidden; background: #f0f2f5; }
.img-wrap img { width: 100%; height: 100%; object-fit: cover; }
.img-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; color: #c0c4cc; }
.type-tag { position: absolute; top: 8px; left: 8px; }
.item-body { padding-top: 10px; }
.item-title { font-weight: 600; font-size: 15px; margin-bottom: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-meta { color: #909399; font-size: 13px; margin-bottom: 4px; }
.item-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
.publisher { color: #909399; font-size: 12px; }
.pager { display: flex; justify-content: center; padding: 12px 0 24px; }
</style>
