import axios from "axios";

export async function newProject(groupData, projectData) {
    try {
      const response = await axios.post('/api/supabaseNewProject', {
        groupData,
        projectData,
      });
  
      console.log('Response:', response); // Add this line
      console.log(response.data.message);
    } catch (error) {
      console.error('Error:', error.message);
      console.error('Full Error:', error); // Add this line
    }
  }