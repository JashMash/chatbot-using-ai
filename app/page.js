'use client'

import { Box, Button, Stack, TextField, Typography, Text } from "@mui/material";
import { fileFromPath } from "openai";
import { useEffect, useState } from "react";

// Packages for markdown formating from Model
import ReactMarkdown from 'react-markdown'
import pdfToText from "react-pdftotext";

// const axios = require('axios');

// const FormData = require('form-data');

export default function Home() {

  const [aiMessages, setAiMessages] = useState([{
    role: `assistant`,
    content: `Hi I'm the JashAI, a bot for conducting AI-powered software development interviews, how can I assist you today?`,
  }])

  const [prompt, setPrompt] = useState('')

  // state var for portal to Add resume
  const [isUploading, setIsUploading] = useState(false)

  const [resumeFile, setResumeFile] = useState(null)
  const [resumeContent, setResumeContent] = useState("")


  useEffect(() =>{
    if (resumeFile) {
      sendRAGInfo();
    }
  }, [resumeFile])

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setResumeFile(file)
    }
  }

  const sendRAGInfo = async () => {
     if (!resumeFile) return;

     setIsUploading(true)
     setAiMessages((pastMessages)=> [
      ...pastMessages,
      { role:'user', content: 'Uploaded resume'},
      { role: 'assistant', content: 'Memory has been updated your answers will be tailored to your submitted document now!'},
     ])

     await pdfToText(resumeFile)
     .then(text =>{
      // console.log("File as text:", text)
      setResumeContent(text)
    })
    .catch(error => console.error("Failed to extract text from PDF.."))

    setIsUploading(false)
    setResumeFile(null)
  }


  // Processing of sending the prompt and receving the response 
  const sendPrompt = async () => {
    if (!prompt) return;
    setAiMessages((aiMessages) => [
      ...aiMessages,
      {role:'user', content:prompt},
      {role:'assistant', content:''},
    ])

    const formData = new FormData()
    formData.append('document', resumeContent)
    formData.append('messages', JSON.stringify([
      ...aiMessages,
      { role:'user', content:prompt},
    ]))
    try{

      const response = fetch('/api/chat',{
        method:'POST',
        // headers:{
        //   'Content-Type': 'application/json'
        // },
        body: formData
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
    } catch (error) {
      console.error('Error:', error)
      setAiMessages((pastMessages)=>[
        ...pastMessages,
        { role: 'assistant', content: 'Sorry, there was an error processing your request.'},
      ])
    } finally {
      setIsUploading(false)
      setPrompt('')
    }
  }


  return (
    <Box width="100vw" height="100vh" display="flex"  flexDirection="column" alignItems="center" justifyContent="top">

      <Typography variant="h2">JashAI for SWE Interviewing</Typography>
      {/* User resume upload section implementation  */}

      <Stack maxWidth="80%" display="flex" alignItems={"center"} direction="column" spacing={1} paddingBottom={2}>
            <Typography >Please upload your resume to give personalized answers tailored to your experience or start typing your questions in the prompt box below</Typography>

            <TextField variant="standard" 
            type="file" 
            inputProps={{accept:"application/pdf"}} 
            onChange={handleFileChange}
            disabled={isUploading}/>

          </Stack>

      {/* Section for chat bot area */}
      <Stack display="flex" flexDirection="row" maxHeight="700px" maxWidth="600px" >

        <Stack direction="column" spacing={2} flexGrow={1} overflow="auto" maxHeight="100%" maxWidth="590px"border="1px solid #000">
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
      <Stack direction="row" maxWidth="600px" p={3} spacing={2}>
        <TextField variant="outlined"  fullWidth value={prompt}
                onChange={(e)=>{setPrompt(e.target.value)}}
                disabled={isUploading}/>
          <Button variant= "contained" onClick={()=>sendPrompt()} disabled={isUploading}>{isUploading ? 'Processing..' : 'Submit'}</Button>
      </Stack>
    </Box>
  );
}
