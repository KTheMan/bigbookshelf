<template>
  <div class="w-full h-full bb-launch-redirect">
    <widgets-loading-spinner />
  </div>
</template>

<script>
export default {
  data() {
    return {}
  },
  computed: {},
  methods: {
    goHome() {
      if (this.$route.path !== '/bookshelf') {
        this.$router.replace('/bookshelf')
      }
    }
  },
  mounted() {
    this.goHome()
  }
}
</script>

<style scoped>
.bb-launch-redirect {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #232323;
}
</style>
