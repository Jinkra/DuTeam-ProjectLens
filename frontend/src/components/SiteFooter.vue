<script setup>
import { ShieldCheck } from 'lucide-vue-next'

defineProps({ showDisclaimer: Boolean })
</script>

<template>
  <footer class="site-footer" :class="{ 'with-disclaimer': showDisclaimer }">
    <div class="site-footer-inner">
      <div v-if="showDisclaimer" class="site-disclaimer">
        <strong>本网站为DuTeam团队参赛作品演示站点，不从事任何经营性活动，不提供任何在线交易、客服及商业服务。</strong>
        <strong>参赛赛事：2026・第九届传智杯全国大学生数智创新与AI应用大赛</strong>
      </div>
      <div class="site-footer-meta">
        <p>© 2026 DuTeam. All Rights Reserved. <span>|</span> Made by <a class="jinkra-link" href="https://jinkra.slatt.cn/" target="_blank" rel="noreferrer">Jinkra</a></p>
        <div class="filing-links">
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer"><ShieldCheck :size="14" />吉ICP备2025029295号-2</a>
          <a href="https://beian.mps.gov.cn/" target="_blank" rel="noreferrer"><img src="https://beian.mps.gov.cn/img/logo01.dd7ff50e.png" alt="公安备案图标" />吉公网安备22040002000168号</a>
        </div>
      </div>
    </div>
  </footer>
</template>
