import reactLogo from './../assets/react.svg'
import profile from './../assets/img/profile.jpeg'
import { usePage } from '../hooks/usePage';
import { useEffect, useMemo, useState } from 'react';
import { sidebarItems } from '../props/SidebarProps';
import { useAppwrite } from '../hooks/useAppwrite';
import { useNavigate } from 'react-router-dom';
import { account } from '../lib/appwrite';

const Header: React.FC = () => {
    const {pageId} =  usePage();
    const {logout} = useAppwrite();
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);

    // ✅ Get title dynamically based on current page
    const title = useMemo(() => {
        const found = sidebarItems.find(i => i.pageId === pageId);
        return found ? found.pageTitle : "Memo App";
    }, [pageId]);

  // ✅ Check if user is logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await account.get(); // Get user info if logged in
        setUser({
          name: currentUser.name,
          email: currentUser.email,
        });
      } catch {
        // Not logged in → redirect to login
        navigate('/login');
      }
    };

    checkSession();
  }, [navigate]);
    return ( 
    <div className=" flex  items-center gap-x-4 [box-shadow:0px_1px_2px_rgba(0,0,0,0.14),0px_0px_2px_rgba(0,0,0,0.12)] bg-white shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10 h-[50px] justify-between rounded-sm">
        <div className="flex gap-3 h-full items-center">

        <div className="flex items-center w-[50px] h-full justify-center bg-white ">
        <span className="">
            <img src={reactLogo} alt="" />
        </span>
        </div>
        <div>

        <p className='font-semibold'>{title}</p>
        </div>
        </div>
      <div className="flex items-center gap-3">
        {/* ✅ Show user name or email */}
        {user && (
          <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">
            {user.name || user.email}
          </p>
        )}
        <img
          className="p-[5px] rounded-full w-[40px] h-[40px] object-cover border border-gray-300"
          src={profile}
          alt="Profile"
        />
        <button
          onClick={logout}
          className="px-3 py-2 bg-amber-100 hover:bg-amber-200 rounded-md text-sm font-semibold"
        >
          Logout
        </button>
      </div>
    </div> 
    );
}
 
export default Header;
