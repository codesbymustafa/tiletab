import React, { JSX } from 'react'
import { useState, useEffect } from 'react'

function Clock(): JSX.Element {
      const [time, setTime] = useState(new Date().toLocaleTimeString());
      
      useEffect(() => {
        const t = setInterval(() => {
          setTime(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(t);
      }, []);
      
      return (
        <div className="h-full w-full flex items-center justify-center bg-gray-900">
          <div className="text-xl font-bold text-green-400">
            {time}
          </div>
        </div>
      );
    }

export default Clock;