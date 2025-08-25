import { Id } from "../shared/repository"
import { UserProfile } from "../entities/entities"

export interface UserProfileRepository {
    getUserProfileById(id: Id): Promise<UserProfile | null>
}