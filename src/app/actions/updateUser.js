export const updateUser = async (setUser) => {
  try {
    const userRes = await fetch('/api/get-me');
    const user = await userRes.json();

    if (user.success) {
      setUser(user.user);
    } else {
      console.error('Failed to update user data.');
    }
  } catch (error) {
    console.error('Error updating user:', error);
  }
};
