'use client'

import { Box, Button, Stack, TextField, Typography, Text } from "@mui/material";
import { useState } from "react";

// Packages for markdown formating from Model
import ReactMarkdown from 'react-markdown'

export default function Home() {

  const [aiMessages, setAiMessages] = useState([{
    role: `assistant`,
    content: `Hi I'm the JashAI, a bot for conducting AI-powered software development interviews, how can I assist you today?`,
  }])

  const [prompt, setPrompt] = useState('')

  // Processing of sending the prompt and receving the response 
  const sendPrompt = async () => {
    setPrompt('')
    setAiMessages((aiMessages) => [
      ...aiMessages,
      {role:'user', content:prompt},
      {role:'assistant', content:''},
    ])
    
    const response = fetch('/api/chat',{
      method:'POST',
      headers:{
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([...aiMessages, {role:'user', content:prompt}])
    }).then( async (res) => {
      // The response from OpenAI Model and now to decode
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      let result = ''
      // Once reader has been .read() then need to decode it
      return reader.read().then(function processText({done, value}){
        if (done){
          return result
        }
        const text = decoder.decode(value || new Int8Array(), {stream:true})
        // resetting format for all messages shown to user
        setAiMessages((aiMessages)=>{
          let lastM = aiMessages[aiMessages.length-1]
          let otherM = aiMessages.slice(0, aiMessages.length-1)
          return [
            ...otherM,
            {
              ...lastM,
              // Appending to the last part of the message
              content: lastM.content + text,
            },
          ]
        })
        // Recursive to make sure all the chunks are processed
        return reader.read().then(processText)
      })
    })
  }


  return (
    <Box width="100vw" height="100vh" display="flex"  flexDirection="column" alignItems="center" justifyContent="top">
      <Typography variant="h2">AI Chatbot for Interviewing</Typography>
      <Typography>Please enter your questions in the prompt box below and you will get an answer in the box:</Typography>
      <Stack display="flex" flexDirection="row" height="700px" width="600px" >

        <Stack direction="column" spacing={2} flexGrow={1} overflow="auto" maxHeight="100%" width="600px"border="1px solid #000">
          {
            aiMessages.map((message, index) =>(
              <Box   key={index} display="flex" justifyContent={ message.role ==="assistant" ? "flex-start" : "flex-end"}p={1}>
                <Box maxWidth="80%" mode="plain" bgcolor={message.role ==="assistant" ? "#ededed" : "green"} color={message.role ==="assistant" ? "#black" : "white"} borderRadius={5} p={1} spacing={1} paddingLeft={message.role ==="assistant" ? 4 : 1}
                >
                  <ReactMarkdown >
                  {message.content}
                  </ReactMarkdown>
                </Box>
              </Box>
            ))
          }
        </Stack>        
        
      </Stack>
      <Stack direction="markdown" width="600px" p={3} spacing={2}>
        <TextField variant="outlined"  fullWidth value={prompt}
                onChange={(e)=>{setPrompt(e.target.value)}}/>
          <Button variant= "contained" onClick={()=>sendPrompt()}>Submit</Button>
      </Stack>
    </Box>
  );
}
