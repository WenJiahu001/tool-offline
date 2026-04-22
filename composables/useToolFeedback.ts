import { ref } from 'vue'

export function useToolFeedback() {
  const errorMessage = ref('')
  const successMessage = ref('')

  const clearMessages = () => {
    errorMessage.value = ''
    successMessage.value = ''
  }

  const showError = (message: string) => {
    errorMessage.value = message
    successMessage.value = ''
  }

  const showSuccess = (message: string) => {
    successMessage.value = message
    errorMessage.value = ''
  }

  return {
    errorMessage,
    successMessage,
    clearMessages,
    showError,
    showSuccess,
  }
}
