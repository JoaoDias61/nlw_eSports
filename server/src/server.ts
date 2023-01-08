import express from 'express'
import cors from 'cors'

import { PrismaClient } from '@prisma/client'
import { convertStringToMinutes } from './utils/convert-hour-string-to-minutes'
import { convertMinutesToHour } from './utils/convert-minutes-to-hour-string'

const app = express()
app.use(express.json())
app.use(cors())
const prisma = new PrismaClient({
    log: ['query']
})

app.get("/games", async (request, response) => {
    const games = await prisma.game.findMany({
        include: {
            _count: {
                select: {
                    Ads: true,
                }
            }
        }
    })

    return response.json(games)
});

app.post("/ads", (request, response) => {
    return response.json([])
});


app.get('/games/:id/ads', async (request, response) => {
    const gameId = request.params.id;

    const ads = await prisma.ad.findMany({
        select: {
            id: true,
            name: true,
            weekDays: true,
            useVoiceChannel: true,
            yearsPlaying: true,
            hourStart: true,
            hourEnd: true,
        },
        where: {
            gameId,
        },
        orderBy: {
            createdAt: 'desc'
        }
    })
    return response.json(ads.map(ad => {
        return {
            ...ad,
            weekDays: ad.weekDays.split(','),
            hourStart: convertMinutesToHour(ad.hourStart),
            hourEnd: convertMinutesToHour(ad.hourEnd)

        }
    }))

})


app.get('/ads/:id/discord', async (request, response) => {
    const adId = request.params.id;

    const ad = await prisma.ad.findUniqueOrThrow({
        select: {
            discord: true,
        },
        where: {
            id: adId,
        }
    })

    return response.json({
        discord: ad.discord
    })
})

app.post('/games/:id/ads', async (request, response) => {
    const gameId = request.params.id;
    const body = request.body;


    const ad = await prisma.ad.create({
        data: {
            gameId,
            name: body.name,
            yearsPlaying: body.yearsPlaying,
            discord: body.discord,
            weekDays: body.weekDays.join(','),
            hourStart: convertStringToMinutes(body.hour.Start),
            hourEnd: convertStringToMinutes(body.hourEnd),
            useVoiceChannel: body.useVoiceChannel
        }
    })

    return response.status(201).json(body)
})

app.listen(3333)