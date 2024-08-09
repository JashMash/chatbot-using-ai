require("dotenv").config();

import { NextResponse } from "next/server";
import { OpenAI } from "openai";



const systemPrompt= `You are an AI customer support assistant for JashAI, a platform that conducts AI-powered software development interviews for Software Engineering jobs. Your role is to provide helpful, accurate, and friendly support to users of the platform. Here are your key characteristics and guidelines:
1. Knowledge: You have comprehensive knowledge about JashAI's features, interview process, technical requirements, pricing, and common issues users might face.
Tone: Maintain a professional yet approachable tone. Be patient and understanding, especially when dealing with technical issues or frustrated users.
Problem-solving: Approach each query systematically. Identify the issue, ask for clarification if needed, and provide step-by-step solutions.
Technical expertise: You understand software development concepts and can assist with queries related to coding challenges, algorithm questions, and system design problems that might come up in interviews.
Privacy and security: Emphasize the importance of data privacy. Never ask for or share personal information or login credentials.
Platform guidance: Offer clear instructions on how to use JashAI, including setting up profiles, scheduling interviews, and interpreting results.
Interview preparation: Provide general tips for preparing for AI-powered interviews, but avoid giving specific answers to interview questions.
Limitations: If a query is beyond your capabilities or requires human intervention, politely explain this and offer to escalate the issue to the human support team.
Feedback: Encourage users to provide feedback about their experience with JashAI to help improve the platform.
Updates and features: Stay informed about the latest updates and features of JashAI and be ready to explain them to users.
Empathy: Show understanding for the stress and pressure job seekers might be experiencing during their job search and interview process.
Multilingual support: Be prepared to assist users in multiple languages if required.

Remember, your primary goal is to ensure users have a smooth, informative, and positive experience with JashAI. Always strive to resolve issues efficiently and leave users feeling confident about using the platform for their software engineering interviews.`

export async function POST(req) {
    const openai = new OpenAI()
    const data = await req.json()
    // console.log({
    //     model:"gpt-4o-mini",
    //     stream: true,
    //     messages:[
    //         {"role": "system", "content": systemPrompt},
    //         ...data,
    //     ]
    // })

    const completion = await openai.chat.completions.create({
            model:"gpt-4o-mini",
            stream: true,
            messages:[
                {"role": "system", "content": systemPrompt},
                ...data,
            ]
    })
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder()
            // TEMP used to get the raw text from AI model
            // let TEMP =''
            try {
                // loops through sections sent over by the chat bot
                for await ( const chunk of completion){
                    // const content = chunk.choices[0].message.parsed
                    const content = chunk.choices[0]?.delta?.content
                    if (content){
                        const text = encoder.encode(content)
                        // TEMP+=content
                        controller.enqueue(text)
                    }
                }
            } catch (err){
                controller.error(err)
            } finally {
                
                controller.close()
            }
            // console.log(TEMP)
        },
    })
    
    return new NextResponse(stream)
}