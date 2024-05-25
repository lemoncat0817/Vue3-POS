<template>
  <div
    class="w-screen h-screen bg-[url('@/assets/login-Bg.png')] bg-no-repeat bg-[length:100%_100%] text-white relative">
    <div
      class="absolute top-[40%] left-[50%] translate-x-[-50%] translate-y-[-50%] flex flex-col items-center gap-[50px]">
      <h1 class="text-[50px] font-bold">MAJI Tea House POS系統</h1>
      <input placeholder="請輸入帳號"
        class="w-[200px] rounded-[20px] p-2 bg-[#f8f8dc] text-[#560710] text-center focus:w-[400px] transition-width duration-700">
      <input placeholder="請輸入密碼" type="password"
        class="w-[200px] rounded-[20px] p-2 bg-[#f8f8dc] text-[#560710] text-center focus:w-[400px] transition-width duration-700">
      <button
        class="w-[100px] rounded-[20px] p-2 bg-[#cc191f] text-center cursor-pointer font-bold hover:w-[200px] transition-width duration-700 hover:bg-[#ff4500]">登入</button>
    </div>
  </div>
</template>

<script setup>

</script>

<style lang="scss" scoped></style>