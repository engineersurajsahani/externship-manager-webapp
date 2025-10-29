// Utility to seed sample project data for PM filtering demo (using MongoDB API)
import { apiService } from '../services/api';

export const seedProjectData = async () => {
  const sampleProjects = [
    {
      name: 'Externship Manager Platform',
      description: 'Main platform for managing externships',
      status: 'active',
      priority: 'high',
      startDate: new Date('2024-01-10'),
      endDate: new Date('2024-06-30'),
    },
    {
      name: 'Mobile App Development',
      description: 'Native mobile app for externship tracking',
      status: 'active',
      priority: 'medium',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-07-15'),
    },
    {
      name: 'Analytics Dashboard',
      description: 'Business intelligence and reporting system',
      status: 'active',
      priority: 'high',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-05-30'),
    },
    {
      name: 'API Microservices',
      description: 'Backend API services architecture',
      status: 'active',
      priority: 'medium',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-08-31'),
    },
  ];

  try {
    // Create projects via API
    const createdProjects = [];
    for (const project of sampleProjects) {
      try {
        const response = await apiService.createProject(project);
        if (response.data.success) {
          createdProjects.push(response.data.project);
        }
      } catch (error) {
        console.error('Error creating project:', project.name, error);
      }
    }

    console.log(`Seeded ${createdProjects.length} projects to MongoDB`);
    return createdProjects;
  } catch (error) {
    console.error('Error seeding project data:', error);
    return [];
  }
};

// Note: User seeding should be handled through proper user registration/admin panels
// This is kept for reference but shouldn't be used in production MongoDB setup
export const seedPMUsers = async () => {
  console.warn(
    'seedPMUsers: User creation should be handled through proper registration/admin panels.'
  );
  console.log(
    'Please use the user management interface to create Project Manager accounts.'
  );

  // For development only - in production this should not be used
  try {
    const response = await apiService.getAllUsers();
    const existingUsers = response.data.users || [];

    const existingPMs = existingUsers.filter(
      (user) => user.role === 'project_manager'
    );

    if (existingPMs.length === 0) {
      console.log(
        'No Project Managers found. Please create PM accounts through the user management system.'
      );
    }

    return existingUsers;
  } catch (error) {
    console.error('Error checking existing users:', error);
    return [];
  }
};

// Enhanced daily updates seeding is no longer needed with MongoDB
// Daily updates should be created naturally by users through the interface
export const seedEnhancedDailyUpdates = async () => {
  console.log(
    'seedEnhancedDailyUpdates: Daily updates are now managed through MongoDB.'
  );
  console.log(
    'Users will create daily updates naturally through the application interface.'
  );

  // This function is deprecated in the MongoDB setup
  return [];
};
