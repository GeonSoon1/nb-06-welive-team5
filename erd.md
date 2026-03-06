```mermaid
erDiagram
    %% ==========================================
    %% Entities
    %% ==========================================
    Apartment {
        String id PK
        String name
        String address
        String officeNumber
        String description
        DateTime createdAt
        DateTime updatedAt
        ApartmentStatus apartmentStatus
        String adminId FK "Unique"
        String ApartmentboardId FK "Unique"
    }

    ApartmentBoard {
        String id PK
        DateTime createdAt
        DateTime updatedAt
    }

    User {
        String id PK
        String username "Unique"
        String password
        String contact "Unique"
        String name
        String email "Unique"
        String image
        Role role
        JoinStatus joinStatus
        String dong
        String ho
        String apartmentId FK
    }

    Resident {
        String id PK
        String dong
        String ho
        String name
        String contact
        HouseHolderStatus isHouseholder
        ResidenceStatus residenceStatus
        String userId FK "Unique"
        String apartmentId FK
    }

    Notice {
        String id PK
        NoticeCategory category
        String title
        String content
        Boolean isImportant
        Boolean isSchedule
        DateTime startDate
        DateTime endDate
        Int viewCount
        Int commentsCount
        DateTime createdAt
        DateTime updatedAt
        String authorId FK
        String apartmentboardId FK
    }

    Complaint {
        String id PK
        String title
        String content
        Boolean isPublic
        ComplaintStatus status
        Int viewCount
        Int commentsCount
        DateTime createdAt
        DateTime updatedAt
        String authorId FK
        String apartmentboardId FK
    }

    Comment {
        String id PK
        String content
        DateTime createdAt
        DateTime updatedAt
        String authorId FK
        String noticeId FK
        String complaintId FK
        String voteId FK
    }

    Vote {
        String id PK
        String title
        String content
        Int targetScope
        DateTime startTime
        DateTime endTime
        VoteStatus status
        DateTime createdAt
        DateTime updatedAt
        String authorId FK
        String apartmentboardId FK
    }

    VoteOption {
        String id PK
        String content
        Int voteCount
        String voteId FK
        DateTime createdAt
        DateTime updatedAt
    }

    VoteRecord {
        String id PK
        DateTime createdAt
        String userId FK
        String voteId FK
        String voteOptionId FK
    }

    Notification {
        String id PK
        String content
        NotificationType notificationType
        Boolean isChecked
        String noticeId FK
        String complaintId FK
        String voteId FK
        String userId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Event {
        String id PK
        String title
        BoardType type
        DateTime startDate
        DateTime endDate
        NotificationType category
        String apartmentId FK
        String noticeId FK
        String voteId FK
        DateTime createdAt
        DateTime updatedAt
    }

    %% ==========================================
    %% Relationships
    %% ==========================================
    
    %% Apartment & Hub Relations
    Apartment ||--o| User : "admin (1:1)"
    Apartment ||--o{ User : "users (1:N)"
    Apartment ||--o{ Resident : "residents (1:N)"
    Apartment ||--|| ApartmentBoard : "has_board (1:1)"
    Apartment ||--o{ Event : "events (1:N)"

    %% ApartmentBoard Hub (The Core)
    ApartmentBoard ||--o{ Notice : "contains"
    ApartmentBoard ||--o{ Complaint : "contains"
    ApartmentBoard ||--o{ Vote : "contains"

    %% User Relations
    User ||--o| Resident : "resident (1:1)"
    User ||--o{ Notice : "author (1:N)"
    User ||--o{ Complaint : "author (1:N)"
    User ||--o{ Comment : "author (1:N)"
    User ||--o{ Vote : "author (1:N)"
    User ||--o{ VoteRecord : "myVotes (1:N)"
    User ||--o{ Notification : "notifications (1:N)"

    %% Notice Relations
    Notice ||--o{ Comment : "comments (1:N)"
    Notice ||--o{ Notification : "notifications (1:N)"
    Notice ||--o{ Event : "events (1:N)"

    %% Complaint Relations
    Complaint ||--o{ Comment : "comments (1:N)"
    Complaint ||--o{ Notification : "notifications (1:N)"

    %% Vote Relations
    Vote ||--o{ VoteOption : "voteOptions (1:N)"
    Vote ||--o{ VoteRecord : "voteRecords (1:N)"
    Vote ||--o{ Comment : "comments (1:N)"
    Vote ||--o{ Notification : "notifications (1:N)"
    Vote ||--o{ Event : "events (1:N)"

    %% VoteOption Relations
    VoteOption ||--o{ VoteRecord : "selections (1:N)"