import axios from "axios";
import { useState , useContext } from "react";
import { UserContext } from "./UserContext";


export default function RegisterAndLoginForm(){
    const [username,setUsername]=useState('');
    const [password,setPassword]=useState('');
    const [isLoginOrRegister,setIsLoginOrRegister]=useState('register');
    const {setUsername:setLoggedInUsername , setId}=useContext(UserContext);

    async function handleSubmit(ev){
        ev.preventDefault();
        const url = isLoginOrRegister === 'register' ? 'register':'login';
        
        try{
            const {data}=await axios.post(url , {username,password});
            setLoggedInUsername(username);
            setId(data.id);
        }
        catch (error) {
            if (error.response) {
                // Handle known error responses from the server
                if (error.response.status === 401) {
                    alert('Wrong password. Please try again.');
                } else if (error.response.status === 404) {
                    alert('Username does not exist.');
                } else if (error.response.status === 409) {
                    alert('this username already exists , please chose a another unique username');
                } else {
                    alert('An unexpected error occurred. Please try again.');
                }
            } else {
                // Handle network or other errors
                alert('Unable to connect to the server. Check your internet connection. or try another unique username');
            }
            window.location.reload();
        }
        
    }

    return (
        <div className="bg-blue-50 h-screen flex items-center">
            <form className="w-64 mx-auto mb-12" onSubmit={handleSubmit}>
                <input value={username}
                    onChange={ev=> setUsername(ev.target.value)}
                    type="text" placeholder="username"
                    className="block w-full rounded-sm p-2 mb-2 border" />
                <input value={password}
                    onChange={ev => setPassword(ev.target.value)}
                    type="password"
                    placeholder="password"
                    className="bock w-full rounded-sm p-2 mb-2 border" />
                <button className="bg-blue-500 text-white block w-full rounded-sm p-2">
                    {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
                    </button>
                <div className="text-center mt-2">
                    {isLoginOrRegister === 'register' && (
                        <div>
                            Already a member?   
                            <button 
                            className="text-blue-500 "
                            onClick={()=>{
                            setIsLoginOrRegister('login');
                            }}>
                            Login 
                            </button>
                        </div>
                        
                    )}
                    {isLoginOrRegister === 'login' && (
                        <div>
                            not a member?                              
                            <button 
                            className="text-blue-500 "
                            onClick={() =>{
                            setIsLoginOrRegister('register');
                            }}>
                                Register
                            </button>
                        </div>
                    )} 
                    
                </div>
            </form>
        </div>
    );
}