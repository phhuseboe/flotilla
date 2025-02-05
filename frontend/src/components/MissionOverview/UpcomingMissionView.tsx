import { Button, Typography } from '@equinor/eds-core-react'
import styled from 'styled-components'
import { UpcomingMissionCard } from './UpcomingMissionCard'
import { useApi } from 'api/ApiCaller'
import { useEffect, useState } from 'react'
import { Mission, MissionStatus } from 'models/Mission'
import { NoUpcomingMissionsPlaceholder } from './NoMissionPlaceholder'
import { ScheduleMissionDialog } from './ScheduleMissionDialog'
import { EchoMission } from 'models/EchoMission'
import { Robot } from 'models/Robot'

const StyledMissionView = styled.div`
    display: grid;
    grid-column: 1/ -1;
    gap: 1rem;
`

const MissionTable = styled.div`
    display: grid;
    grid-template-rows: repeat(auto-fill);
    gap: 1rem;
`

const MissionButtonView = styled.div`
    display: flex;
    gap: 2rem;
`
const mapEchoMissionToString = (missions: EchoMission[]): Map<string, EchoMission> => {
    var missionMap = new Map<string, EchoMission>()
    missions.map((mission: EchoMission) => {
        missionMap.set(mission.id + ': ' + mission.name, mission)
    })
    return missionMap
}

const mapRobotsToString = (robots: Robot[]): Map<string, Robot> => {
    var robotMap = new Map<string, Robot>()
    robots.map((robot: Robot) => {
        robotMap.set(robot.name + ' id: ' + robot.id, robot)
    })
    return robotMap
}

export function UpcomingMissionView() {
    const apiCaller = useApi()
    const [upcomingMissions, setUpcomingMissions] = useState<Mission[]>([])
    const [selectedEchoMissions, setSelectedEchoMissions] = useState<EchoMission[]>([])
    const [selectedRobot, setSelectedRobot] = useState<Robot>()
    const [echoMissions, setEchoMissions] = useState<Map<string, EchoMission>>()
    const [robotOptions, setRobotOptions] = useState<Map<string, Robot>>()
    const [assetString, setAssetString] = useState<string>('')
    const [scheduleButtonDisabled, setScheduleButtonDisabled] = useState<boolean>(true)

    const onSelectedEchoMissions = (selectedEchoMissions: string[]) => {
        var echoMissionsToSchedule: EchoMission[] = []
        selectedEchoMissions.map((selectedEchoMission: string) => {
            if (echoMissions) echoMissionsToSchedule.push(echoMissions.get(selectedEchoMission) as EchoMission)
        })
        setSelectedEchoMissions(echoMissionsToSchedule)
    }
    const onSelectedRobot = (selectedRobot: string) => {
        if (robotOptions === undefined) return

        setSelectedRobot(robotOptions.get(selectedRobot) as Robot)
    }

    const onScheduleButtonPress = () => {
        if (selectedRobot === undefined) return

        selectedEchoMissions.map((mission: EchoMission) => {
            console.log(`Schedule Echo missions ${mission.id}: ${mission.name} to robot ${selectedRobot.name}`)
            apiCaller.postMission(mission.id, selectedRobot.id, new Date())
        })
    }
    useEffect(() => {
        apiCaller.getMissionsByStatus(MissionStatus.Pending).then((missions) => {
            setUpcomingMissions(missions)
        })
    }, [])

    useEffect(() => {
        const installationCode = sessionStorage.getItem('assetString')
        if (installationCode != assetString) {
            setAssetString(installationCode as string)
        }
    }, [sessionStorage.getItem('assetString')])

    useEffect(() => {
        const id = setInterval(() => {
            apiCaller.getEchoMissions(assetString).then((missions) => {
                const mappedEchoMissions: Map<string, EchoMission> = mapEchoMissionToString(missions)
                setEchoMissions(mappedEchoMissions)
            })
        }, 1000)
        return () => clearInterval(id)
    }, [])

    useEffect(() => {
        const id = setInterval(() => {
            apiCaller.getRobots().then((robots) => {
                const mappedRobots: Map<string, Robot> = mapRobotsToString(robots)
                setRobotOptions(mappedRobots)
            })
        }, 1000)
        return () => clearInterval(id)
    }, [])

    useEffect(() => {
        const id = setInterval(() => {
            apiCaller.getMissionsByStatus(MissionStatus.Pending).then((missions) => {
                setUpcomingMissions(missions)
            })
        }, 1000)
        return () => clearInterval(id)
    }, [])

    useEffect(() => {
        if (selectedRobot === undefined || selectedEchoMissions.length === 0) {
            setScheduleButtonDisabled(true)
        } else {
            setScheduleButtonDisabled(false)
        }
    }, [selectedRobot, selectedEchoMissions])

    var upcomingMissionDisplay = upcomingMissions.map(function (mission, index) {
        return <UpcomingMissionCard key={index} mission={mission} />
    })
    return (
        <StyledMissionView>
            <Typography variant="h2" color="resting">
                Upcoming missions
            </Typography>
            <MissionTable>
                {upcomingMissions.length > 0 && upcomingMissionDisplay}
                {upcomingMissions.length === 0 && <NoUpcomingMissionsPlaceholder />}
            </MissionTable>
            <MissionButtonView>
                {echoMissions && robotOptions && (
                    <>
                        <ScheduleMissionDialog
                            robotOptions={Array.from(robotOptions.keys())}
                            echoMissionsOptions={Array.from(echoMissions.keys())}
                            onSelectedMissions={onSelectedEchoMissions}
                            onSelectedRobot={onSelectedRobot}
                            onScheduleButtonPress={onScheduleButtonPress}
                            scheduleButtonDisabled={scheduleButtonDisabled}
                        ></ScheduleMissionDialog>
                        <Button>Make new mission in Echo</Button>
                    </>
                )}
            </MissionButtonView>
        </StyledMissionView>
    )
}
