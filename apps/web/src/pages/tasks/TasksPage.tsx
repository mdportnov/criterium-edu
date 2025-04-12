import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, DataTable, Button } from '@/components/common';
import { tasksService } from '@/api';
import { useAuth } from '@/context/AuthContext.tsx';
import { UserRole } from '@/types';

const TasksPage = () => {
  const { hasRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksService.getAll(),
  });
  
  // Filter tasks based on search query
  const filteredTasks = tasks?.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-header mb-0">Tasks</h1>
        {hasRole([UserRole.ADMIN, UserRole.MENTOR]) && (
          <Link to="/tasks/create" className="btn btn-primary">
            Create Task
          </Link>
        )}
      </div>
      
      <Card>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search tasks..."
            className="input input-bordered w-full"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <DataTable
          columns={[
            { header: 'Title', accessor: 'title' },
            { 
              header: 'Description', 
              accessor: (row) => row.description.length > 100 
                ? `${row.description.substring(0, 100)}...` 
                : row.description 
            },
            { 
              header: 'Created At', 
              accessor: (row) => new Date(row.createdAt).toLocaleDateString() 
            },
            { 
              header: 'Actions', 
              accessor: (row) => (
                <div className="flex gap-2">
                  <Link to={`/tasks/${row.id}`} className="btn btn-sm btn-primary">
                    View
                  </Link>
                  {hasRole([UserRole.ADMIN, UserRole.MENTOR]) && (
                    <Link to={`/tasks/${row.id}/edit`} className="btn btn-sm btn-secondary">
                      Edit
                    </Link>
                  )}
                </div>
              ),
              className: 'w-40',
            },
          ]}
          data={filteredTasks || []}
          isLoading={isLoading}
          keyExtractor={(item) => item.id.toString()}
          emptyMessage="No tasks found. Create a new task or adjust your search."
        />
      </Card>
    </div>
  );
};

export default TasksPage;
