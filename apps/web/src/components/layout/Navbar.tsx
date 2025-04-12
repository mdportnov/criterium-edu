import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.tsx';
import { UserRole } from '@/types';
import { ThemeSwitcher } from '@/components/common';

export const Navbar = () => {
  const { user, logout, hasRole } = useAuth();
  
  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="navbar-start">
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </label>
          <ul tabIndex={0} className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/tasks">Tasks</Link></li>
            {hasRole([UserRole.ADMIN, UserRole.MENTOR]) && (
              <li><Link to="/reviews">Reviews</Link></li>
            )}
            {hasRole([UserRole.ADMIN]) && (
              <li><Link to="/users">Users</Link></li>
            )}
          </ul>
        </div>
        <Link to="/" className="btn btn-ghost normal-case text-xl">Criterium EDU</Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/tasks">Tasks</Link></li>
          {hasRole([UserRole.ADMIN, UserRole.MENTOR]) && (
            <li><Link to="/reviews">Reviews</Link></li>
          )}
          {hasRole([UserRole.ADMIN]) && (
            <li><Link to="/users">Users</Link></li>
          )}
        </ul>
      </div>
      <div className="navbar-end flex gap-2">
        <ThemeSwitcher />
        
        {user ? (
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="avatar placeholder">
                <div className="bg-neutral-focus text-neutral-content rounded-full w-10">
                  <span>{user.firstName?.[0] || ''}{user.lastName?.[0] || ''}</span>
                </div>
              </div>
            </label>
            <ul tabIndex={0} className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
              <li className="text-sm opacity-70 p-2">
                <span className="font-semibold">Signed in as:</span>
                <span className="block">{user.email}</span>
              </li>
              <div className="divider my-0"></div>
              <li><Link to="/profile">Profile</Link></li>
              <li><a onClick={logout}>Logout</a></li>
            </ul>
          </div>
        ) : (
          <Link to="/login" className="btn btn-primary">Login</Link>
        )}
      </div>
    </div>
  );
};
