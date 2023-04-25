import supabase from '../../lib/supabaseClient';

export default async function handler(req, res) {
    try {
  console.log('API Route: Received a request');

  if (req.method === 'POST') {
    const { groupData, projectData } = req.body;

    try {
      console.log('API Route: Checking for existing group');
      // Check if the Group exists
      const { data: existingGroup, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('group_name', groupData.group_name)
        .single();

      if (groupError) {
        throw groupError;
      }

      let groupId;
      if (existingGroup) {
        console.log('Existing group ID:', existingGroup.group_id); // Add this log
        console.log('Group data to update:', groupData); // Add this log
      
        // Update the existing Group's information
        const { data: updatedGroup, error: updategroupError } = await supabase
          .from('groups')
          .update(groupData)
          .eq('group_id', existingGroup.group_id);
      
        if (updategroupError) {
          throw updategroupError;
        }
      
        if (updatedGroup && updatedGroup.length > 0) {
          groupId = updatedGroup[0].group_id;
        } else {
          throw new Error('Failed to update the group');
        }
      } else {
        // Insert a new Group
        const { data: newGroup, error: insertGroupError } = await supabase.from('groups').insert([groupData]);
      
        if (insertGroupError) {
          throw insertGroupError;
        }
      
        if (newGroup && newGroup.length > 0) { // Add this check
          groupId = newGroup[0].group_id;
        } else {
          throw new Error('Failed to insert the new group');
        }
      }

      console.log('API Route: Inserting data into projects table');
      // Insert data into the 'profiles' table with the related 'group_id'
      const { error: projectError } = await supabase.from('projects').insert([
        {
          ...projectData,
          group_id: groupId,
        },
      ]);

      if (projectError) {
        throw projectError;
      }

      console.log('API Route: Data added or updated successfully');
      res.status(200).json({ message: 'Data added or updated successfully.' });
    } catch (error) {
      console.error('Server error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }
} catch (error) {
    console.error('Unhandled server error:', error);
    console.error('Unhandled error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
}

