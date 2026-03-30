```mermaid
erDiagram
    APARTMENT ||--|| APARTMENT_BOARD : "1:1 Relation"
    APARTMENT ||--o| USER : "Managed by (ADMIN)"
    APARTMENT ||--o{ APARTMENT_STRUCTURE_GROUP : "Defines structure"
    APARTMENT ||--o{ APARTMENT_UNIT : "Contains units"
    APARTMENT ||--o{ USER : "Has residents (USERS)"
    APARTMENT ||--o{ RESIDENT : "Official list"
    APARTMENT ||--o{ EVENT : "Schedules"

    APARTMENT_BOARD ||--o{ NOTICE : "Hosts"
    APARTMENT_BOARD ||--o{ COMPLAINT : "Hosts"
    APARTMENT_BOARD ||--o{ VOTE : "Hosts"

    USER ||--o{ NOTICE : "Authors"
    USER ||--o{ COMPLAINT : "Authors"
    USER ||--o{ COMMENT : "Writes"
    USER ||--o{ VOTE : "Initiates"
    USER ||--o{ VOTE_RECORD : "Casts vote"
    USER ||--o{ NOTIFICATION : "Receives"
    USER ||--o| RESIDENT : "Mapped to profile"
    USER }o--o| APARTMENT_UNIT : "Lives in"

    NOTICE ||--o{ COMMENT : "Has comments"
    NOTICE ||--o{ NOTIFICATION : "Triggers"
    NOTICE ||--o{ EVENT : "Linked to"

    COMPLAINT ||--o{ COMMENT : "Has comments"
    COMPLAINT ||--o{ NOTIFICATION : "Triggers"

    VOTE ||--|{ VOTE_OPTION : "Has options"
    VOTE ||--o{ VOTE_RECORD : "Logs"
    VOTE ||--o{ COMMENT : "Has comments"
    VOTE ||--o{ NOTIFICATION : "Triggers"
    VOTE ||--o{ EVENT : "Linked to"

    VOTE_OPTION ||--o{ VOTE_RECORD : "Selected in"

    %% [Entities with Full Fields]

    APARTMENT {
        string id PK
        string name
        string address
        string officeNumber
        string description
        datetime createdAt
        datetime updatedAt
        enum apartmentStatus
        string apartmentboardId FK
        string adminId FK
    }

    APARTMENT_STRUCTURE_GROUP {
        string id PK
        string apartmentId FK
        string dongList
        int startFloor
        int maxFloor
        int unitsPerFloor
    }

    APARTMENT_UNIT {
        string id PK
        string apartmentId FK
        string dong
        int floor
        string ho
        boolean isActive
    }

    APARTMENT_BOARD {
        string id PK
        datetime createdAt
        datetime updatedAt
    }

    USER {
        string id PK
        string username
        string password
        string contact
        string name
        string email
        string image
        enum role
        string apartmentId FK
        string apartmentUnitId FK
        enum joinStatus
        datetime createdAt
        datetime updatedAt
    }

    RESIDENT {
        string id PK
        string dong
        string ho
        string name
        string contact
        enum isHouseholder
        string userId FK
        string apartmentId FK
        enum residenceStatus
    }

    NOTICE {
        string id PK
        enum category
        string title
        string content
        boolean isImportant
        boolean isSchedule
        datetime startDate
        datetime endDate
        int viewCount
        int commentsCount
        string authorId FK
        string apartmentboardId FK
        boolean isPinned
    }

    COMPLAINT {
        string id PK
        string title
        string content
        boolean isPublic
        enum status
        int viewCount
        int commentsCount
        string authorId FK
        string apartmentboardId FK
    }

    VOTE {
        string id PK
        string title
        string content
        int targetScope
        datetime startDate
        datetime endDate
        enum status
        string authorId FK
        string apartmentboardId FK
    }

    VOTE_OPTION {
        string id PK
        string content
        int voteCount
        string voteId FK
    }

    VOTE_RECORD {
        string id PK
        string userId FK
        string voteId FK
        string voteOptionId FK
    }

    COMMENT {
        string id PK
        string content
        string authorId FK
        string noticeId FK
        string complaintId FK
        string voteId FK
    }

    NOTIFICATION {
        string id PK
        string content
        enum notificationType
        boolean isChecked
        string noticeId FK
        string complaintId FK
        string voteId FK
        string userId FK
    }

    EVENT {
        string id PK
        string title
        enum type
        datetime startDate
        datetime endDate
        enum category
        string apartmentId FK
        string noticeId FK
        string voteId FK
    }

    DELETED_FILE {
        string id PK
        string fileKey
        string reason
        datetime createdAt
    }