export const getDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const format = (num) => num < 10 ? `0${num}` : num;
  return `${year}/${format(month)}/${format(day)}`;
}

export const getDateForOrder = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const format = (num) => num < 10 ? `0${num}` : num;
  return `${year}${format(month)}${format(day)}`;
}

export const getMoment = () => {
  const now = new Date();
  const hour = now.getHours();
  if (hour >= 8 && hour < 12) {
    return "早班"
  } else if (hour >= 12 && hour < 18) {
    return "中班"
  } else if (hour >= 18 && hour <= 22) {
    return "晚班"
  } else {
    return "休息中"
  }
}

export const getTime = () => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();
  const format = (num) => num < 10 ? `0${num}` : num;
  return `${format(hour)}:${format(minute)}:${format(second)}`;
}