
// import reactLogo from './assets/react.svg'

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css'

import {  AppwriteProvider } from './context/AppwriteContext';
import { PageProvider } from './context/PageContext'
import { sidebarItems } from './props/SidebarProps';
import Appview from './page/Appview';
import Login from './page/auth/Login';
import Signup from './page/auth/SignUp';
import { Toaster } from 'react-hot-toast';
import SetupMFA from './page/auth/SetUp-MFA';
import { SelectedItemProvider } from './context/SelectedItemContext';
import VerifyEmail from './page/auth/VerifyEmail';



function App() {
  const initial = sidebarItems.find(i=> i.active)?.pageId ?? sidebarItems[0].pageId; // Set initial pageId for PageProvider

  return (
    
    <AppwriteProvider>
      
      <Toaster  position='top-right' reverseOrder={false}/>
    <PageProvider initial={initial}>
      <SelectedItemProvider>


    <div>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Appview />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/setup-mfa" element={<SetupMFA />} />
      </Routes>
    </BrowserRouter>
   
    </div>
      </SelectedItemProvider>
    </PageProvider>
      
    </AppwriteProvider>
  )
}

export default App
