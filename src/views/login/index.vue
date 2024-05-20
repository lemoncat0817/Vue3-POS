<template>
  <div
    class="w-screen h-screen bg-[url('@/assets/login-Bg.png')] bg-no-repeat bg-[length:100%_100%] bg-center text-white relative">
    <div
      class="absolute top-[40%] left-[50%] translate-x-[-50%] translate-y-[-50%] flex flex-col items-center gap-[50px]">
      <h1 class="text-[50px] font-bold">MAJI Tea House POS系統</h1>
      <input placeholder="請輸入帳號" class="w-[400px] rounded-[20px] p-2 bg-[#f8f8dc] text-center ">
      <input placeholder="請輸入密碼" type="password" class="w-[400px] rounded-[20px] p-2 bg-[#f8f8dc] text-center ">
      <button
        class="w-[200px] rounded-[20px] p-2 bg-[#cc191f] text-center cursor-pointer hover:bg-[#ff4500] font-bold">登入</button>
    </div>
  </div>
</template>

<script setup>

</script>

<style lang="scss" scoped></style>