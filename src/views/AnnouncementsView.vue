<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get } from '@/api'
import type { Announcement, PageResult } from '@/types'
import { formatTime } from '@/utils/format'

const loading = ref(false)
const list = ref<Announcement[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 10

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

onMounted(fetchList)
</script>

<template>
  <div class="announcements">
    <el-card shadow="never">
      <template #header><h3 style="margin: 0">平台公告</h3></template>
      <div v-loading="loading">
        <el-empty v-if="!loading && list.length === 0" description="暂无公告" />
        <el-collapse v-else accordion>
          <el-collapse-item v-for="ann in list" :key="ann.id" :name="ann.id">
            <template #title>
              <div class="ann-title">
                <span class="ann-name">{{ ann.title }}</span>
                <span class="ann-time">{{ formatTime(ann.created_at) }}</span>
              </div>
            </template>
            <div class="ann-content">{{ ann.content }}</div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.announcements { max-width: 860px; margin: 0 auto; }
.ann-title { display: flex; justify-content: space-between; width: 100%; padding-right: 12px; align-items: center; }
.ann-name { font-weight: 600; }
.ann-time { color: #909399; font-size: 12px; }
.ann-content { white-space: pre-wrap; color: #606266; line-height: 1.8; }
</style>
