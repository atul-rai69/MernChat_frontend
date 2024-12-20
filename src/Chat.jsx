import { useContext, useEffect, useRef, useState } from "react"
import { UserContext } from "./UserContext";
import {uniqBy} from "lodash"
import axios from "axios";
import Contact from "./Contact";

export default function Chat(){
    const [ws,setWs] = useState(null);
    const [onlinePeople,setOnlinePeople] = useState({});
    const [selectedUserId,setSelectedUserId] = useState(null);
    const {username , id , setId , setUsername} = useContext(UserContext);
    const [newMessageText,setNewMessageText] = useState('');
    const [messages,setMessages] = useState([]);
    const divUnderMessages = useRef();
    const [offlinePeople,setOfflindPeople] = useState({});

    

    //in case if a disconnection occurs with the backend we will reconnect it reRender the lost data
    // Establishes a WebSocket connection and automatically reconnects on disconnection for real-time communication.
    useEffect(()=>{
        connectToWs();
    }, []);
    //The empty dependency array ensures the effect does not re-run when state or props change.
    function connectToWs() {
        const ws = new WebSocket('ws://localhost:4000');
        setWs(ws);
        ws.addEventListener('message',handleMessage);
        ws.addEventListener('close' , () => {
            setTimeout(() => {
                console.log('disconnected. Trying to reconnect');
                connectToWs();
            }, 1000);
        })
    }

    function showOnlinePeople(peopleArray){
        const people = {};
        peopleArray.forEach(({userId,username}) => {
            people[userId] = username;
        });
        setOnlinePeople(people);
        console.log(people);
    }
    // useEffect(() => {
    //     console.log(onlinePeople);
    // },[onlinePeople]);

    function handleMessage(ev){
        const messageData = JSON.parse(ev.data);
        console.log({ev,messageData});
        if('online' in messageData){
            showOnlinePeople(messageData.online);
        } else if ('text' in messageData) {
            setMessages(prev => ([...prev , {...messageData}]));
        }
    }

    function logout() {
        axios.post('/logout').then(() => {
            setWs(null);
            setId(null);
            setUsername(null);
        })
    }

    const onlinePeopleExclOurUser = {...onlinePeople};
    delete onlinePeopleExclOurUser[id];

    const messagesWithoutDupes = uniqBy(messages , '_id');

    function sendMessage(ev){
        ev.preventDefault();
        ws.send(JSON.stringify({
                recipient: selectedUserId,
                text: newMessageText,
        }));
        setNewMessageText('');
        setMessages(prev => ([...prev , {
            text: newMessageText ,
            sender: id,
            recipient: selectedUserId,
            _id: Date.now(),
        }]));
    }

    //to provide the affect of auto-scrolling this useEffect will run every time th messages array is altered with new messages.
    useEffect(() => {
        const div= divUnderMessages.current;
        if(div){
            div.scrollIntoView({behavior:'smooth',block:'end'});
        }
    },[messages]);

    //this useEffect loads all the users and picks the ones who are offline to also show them on the site.
    useEffect(() => {
        axios.get('/people').then(res => {
            const offlinePeopleArr = res.data
            .filter(p => p._id !== id)
            .filter(p => !Object.keys(onlinePeople).includes(p._id));
            const offlinePeople = {};
            offlinePeopleArr.forEach(p => {
                offlinePeople[p._id] = p;
            })
            setOfflindPeople(offlinePeople);
        });
    }, [onlinePeople])

    //this useEffect will run when a chat has been selected to load all the messages that have been recieved from the backend
    useEffect(()=> {
        if(selectedUserId) {
            axios.get('/messages/'+selectedUserId).then(res => {
                setMessages(res.data);
            });
        }
    },[selectedUserId]);

    return (
        <div className="flex h-screen">
            <div className="bg-white w-1/3 flex flex-col">
                <div className="flex-grow">
                    <div className="text-blue-600 font-bold flex gap-2 p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                        <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 0 0-1.032-.211 50.89 50.89 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 21v-4.03a48.527 48.527 0 0 1-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979Z" />
                        <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 0 0 1.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0 0 15.75 7.5Z" />
                        </svg>
                        MernChat
                    </div>
                    {Object.keys(onlinePeopleExclOurUser).map(userId => (
                        <Contact 
                            key={userId}
                            id={userId}
                            online={true}
                            username={onlinePeopleExclOurUser[userId]}
                            onClick={() => setSelectedUserId(userId)}
                            selected={userId === selectedUserId} />
                    ))}
                    {Object.keys(offlinePeople).map(userId => (
                        <Contact 
                            key={userId}
                            id={userId}
                            online={false}
                            username={offlinePeople[userId].username}
                            onClick={() => setSelectedUserId(userId)}
                            selected={userId === selectedUserId} />
                    ))}
                </div>
                <div className="p-2 text-center flex items-center justify-center ">
                    <span className="mr-2 text-sm text-gray-600 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                        <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
                        </svg>
                    {username}
                    </span>
                    <button 
                    onClick={logout}
                    className="text-sm text-gray-500 bg-blue-100 py-1 px-2 border rounded-sm">logout
                    </button>
                </div>
            </div>
            <div className="flex flex-col bg-blue-50 w-2/3 p-2">
                <div className="flex-grow">
                    {!selectedUserId && (
                        <div className="flex h-full  items-center justify-center">
                            <div className="text-gray-300">&larr; select a person from the sidebar</div>
                        </div>
                    )}
                    {!!selectedUserId && (
                        <div className="relative h-full">
                            <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
                                {messagesWithoutDupes.map(message => (
                                    <div key={message._id} className={(message.sender === id ? 'text-right':'text-left')}>
                                        <div className={"text-left inline-block p-2 rounded-md text-sm mb-2 " + (message.sender === id ? 'bg-blue-500 text-white' : 'bg-white text-gray-500')}>
                                            {message.text}
                                        </div>
                                    </div>
                                ))}
                                <div ref={divUnderMessages}></div>
                            </div>
                        </div>
                        
                    )}
                </div>
                {!!selectedUserId && (
                    <form className="flex gap-2" onSubmit={sendMessage}>
                    <input type="text"
                        value={newMessageText}
                        onChange={ev => setNewMessageText(ev.target.value)}
                        placeholder="type your message here"
                        className="bg-white flex-grow border p-2 rounded-sm" />
                    <button type="submit" className="bg-blue-500 p-2 text-white rounded-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                        </svg>
                    </button>
                </form>
                )}
                
            </div>
        </div>
    )
}