export const getCurrentMonthYear = () => {
    const today = new Date();
    return {
      currentMonth: today.getMonth() + 1, 
      currentYear: today.getFullYear()
    };
  };
  