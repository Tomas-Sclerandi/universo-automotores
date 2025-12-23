import { Request, Response } from "express"
import { AppDataSource } from "../data-source"
import { Meeting } from "../entity/Meeting"
import { User } from "../entity/User"
import { In } from "typeorm"

export class MeetingController {

    static async getAll(request: Request, response: Response) {
        const meetingRepository = AppDataSource.getRepository(Meeting)
        try {
            const meetings = await meetingRepository.find({
                relations: ["creator", "attendees"],
                order: {
                    date: "ASC"
                }
            })
            return response.json(meetings)
        } catch (error) {
            return response.status(500).json({ message: "Error fetching meetings", error })
        }
    }

    static async create(request: Request, response: Response) {
        const { title, date, link, creatorId, attendeeIds } = request.body
        const meetingRepository = AppDataSource.getRepository(Meeting)
        const userRepository = AppDataSource.getRepository(User)

        try {
            const creator = await userRepository.findOneBy({ id: creatorId })
            if (!creator) {
                return response.status(404).json({ message: "Creator not found" })
            }

            let attendees: User[] = []
            if (attendeeIds && attendeeIds.length > 0) {
                attendees = await userRepository.findBy({
                    id: In(attendeeIds)
                })
            }

            const meeting = new Meeting()
            meeting.title = title
            meeting.date = new Date(date)
            meeting.link = link
            meeting.creator = creator
            meeting.attendees = attendees

            await meetingRepository.save(meeting)

            return response.status(201).json(meeting)
        } catch (error) {
            return response.status(500).json({ message: "Error creating meeting", error })
        }
    }

    static async update(request: Request, response: Response) {
        const id = parseInt(request.params.id)
        const { title, date, link, attendeeIds } = request.body
        const meetingRepository = AppDataSource.getRepository(Meeting)
        const userRepository = AppDataSource.getRepository(User)

        try {
            const meeting = await meetingRepository.findOne({
                where: { id },
                relations: ["attendees"]
            })

            if (!meeting) {
                return response.status(404).json({ message: "Meeting not found" })
            }

            if (title) meeting.title = title
            if (date) meeting.date = new Date(date)
            if (link !== undefined) meeting.link = link

            if (attendeeIds) {
                const attendees = await userRepository.findBy({
                    id: In(attendeeIds)
                })
                meeting.attendees = attendees
            }

            await meetingRepository.save(meeting)
            return response.status(200).json(meeting)
        } catch (error) {
            return response.status(500).json({ message: "Error updating meeting", error })
        }
    }

    static async delete(request: Request, response: Response) {
        const id = parseInt(request.params.id)
        const meetingRepository = AppDataSource.getRepository(Meeting)

        try {
            const meeting = await meetingRepository.findOneBy({ id })
            if (!meeting) {
                return response.status(404).json({ message: "Meeting not found" })
            }

            await meetingRepository.remove(meeting)
            return response.status(200).json({ message: "Meeting deleted" })
        } catch (error) {
            return response.status(500).json({ message: "Error deleting meeting", error })
        }
    }
}
