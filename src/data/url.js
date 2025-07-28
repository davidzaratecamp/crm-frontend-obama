// const prod = true;
const prod = false;

export let url;

prod === true
  ? (url = "http://10.255.253.74:4000")
  : (url = "http://localhost:3001");