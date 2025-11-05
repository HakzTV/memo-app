import Header from "../components/Header";
import SideBar from "../components/Sidebar";
// import Profile from "../components/Test";
import MainView from "./MainView";


const Appview = () => {
    return ( 
        <div >

            <Header />
          <div className="flex gap-[5px] mt-[5px]">
    
    <SideBar />
    <MainView />
    {/* <Profile /> */}
    </div>
        </div>
     );
}
 
export default Appview;