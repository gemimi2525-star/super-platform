
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { IFileSystem } from './types';
import { FileSystemService } from './FileSystemService';

const GlobalFileSystem = new FileSystemService();
const FileSystemContext = createContext<IFileSystem>(GlobalFileSystem);

// Service Instance managed globally

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // In future, we might load state asynchronously here
    return (
        <FileSystemContext.Provider value={GlobalFileSystem}>
            {children}
        </FileSystemContext.Provider>
    );
};

export const useFileSystem = () => useContext(FileSystemContext);
