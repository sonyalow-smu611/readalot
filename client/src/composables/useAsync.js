import { ref } from "vue";

export function useAsync(fn) {
  const data = ref(null);
  const error = ref("");
  const loading = ref(false);

  async function run(...args) {
    loading.value = true;
    error.value = "";

    try {
      data.value = await fn(...args);
      return data.value;
    } catch (err) {
      error.value = err.message || "Something went wrong";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return { data, error, loading, run };
}
