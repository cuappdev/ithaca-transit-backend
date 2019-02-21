const THREE_SEC_IN_MS = 3000;

const GET_OPTIONS = {
  method: 'GET',
  headers: { 'Cache-Control': 'no-cache' },
  timeout: THREE_SEC_IN_MS,
};

export default {
  GET_OPTIONS,
};
