// Script to create demo user after migration
// Run this in browser console on the /auth page after migration

const createDemoUser = async () => {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'demo@agent001.com',
        password: 'demo123',
        displayName: 'משתמש דמו'
      }),
    });
    
    const result = await response.json();
    console.log('Demo user creation result:', result);
    
    if (result.success) {
      console.log('✅ Demo user created successfully!');
      console.log('Email: demo@agent001.com');
      console.log('Password: demo123');
    } else {
      console.error('❌ Failed to create demo user:', result.error);
    }
  } catch (error) {
    console.error('❌ Error creating demo user:', error);
  }
};

// Auto-run when script is loaded
createDemoUser();