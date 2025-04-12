import React from 'react';

interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  firstName, 
  lastName, 
  size = 'md',
  className = ''
}) => {
  // Extract initials
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  const initials = `${firstInitial}${lastInitial}`;
  
  // Generate color based on initials
  const colorHash = generateColorFromString(initials);
  
  // Define size dimensions
  const dimensions = {
    sm: { width: '2rem', height: '2rem', fontSize: '0.75rem' },
    md: { width: '2.5rem', height: '2.5rem', fontSize: '0.875rem' },
    lg: { width: '3rem', height: '3rem', fontSize: '1rem' },
    xl: { width: '4rem', height: '4rem', fontSize: '1.25rem' }
  };
  
  // Style with inline CSS for more precise control
  const style = {
    container: {
      display: 'inline-block',
      ...className && {}
    },
    avatar: {
      width: dimensions[size].width,
      height: dimensions[size].height,
      borderRadius: '50%',
      backgroundColor: colorHash,
      color: 'white',
      // Perfect centering with flex
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: dimensions[size].fontSize,
      fontWeight: 500,
      lineHeight: 1
    }
  };
  
  return (
    <div className={className} style={style.container}>
      <div style={style.avatar}>
        {initials}
      </div>
    </div>
  );
};

// Function to generate a color from a string
function generateColorFromString(str: string): string {
  // Default color if string is empty
  if (!str) return '#6366f1'; // Indigo color
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert to a color
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    // Ensure colors are not too light (for better contrast with white text)
    const adjustedValue = Math.max(value, 80); 
    color += adjustedValue.toString(16).padStart(2, '0');
  }
  
  return color;
}
