import { Id } from "../shared/repository"
import { UserProfile } from "../entities/entities"

export interface UserProfileRepository {
    // GET api/profiles
    getUserProfile(): Promise<UserProfile | null>
}