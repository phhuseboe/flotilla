import { Card, Typography } from '@equinor/eds-core-react'
import { tokens } from '@equinor/eds-tokens'
import { Mission } from 'models/Mission'
import styled from 'styled-components'
import { MissionProgressDisplay } from './MissionTagDisplay'
import { MissionStatusDisplay } from './MissionStatusDisplay'
import { useNavigate } from 'react-router-dom'

interface MissionProps {
    mission: Mission
}

const StyledMissionCard = styled(Card)`
    width: 300px;
    padding: 10px;
`
const HorisontalContent = styled.div`
    display: grid;
    grid-template-columns: auto auto 80px;
    align-items: end;
`

export function OngoingMissionCard({ mission }: MissionProps) {
    let navigate = useNavigate()
    const routeChange = () => {
        let path = '/mission/' + mission.id
        navigate(path)
    }
    return (
        <StyledMissionCard variant="default" style={{ boxShadow: tokens.elevation.raised }} onClick={routeChange}>
            <Typography variant="h6">INSPECTION</Typography>
            <Typography>{mission.name}</Typography>
            <HorisontalContent>
                <MissionStatusDisplay status={mission.missionStatus} />
                <MissionProgressDisplay />
            </HorisontalContent>
        </StyledMissionCard>
    )
}
