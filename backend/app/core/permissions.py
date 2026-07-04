from enum import Enum


class Permission(str, Enum):
    # Backlogs
    BACKLOG_VIEW = "backlog:view"
    BACKLOG_CREATE = "backlog:create"
    BACKLOG_UPDATE = "backlog:update"
    BACKLOG_DELETE = "backlog:delete"

    # Features
    FEATURE_VIEW = "feature:view"
    FEATURE_CREATE = "feature:create"
    FEATURE_UPDATE = "feature:update"
    FEATURE_DELETE = "feature:delete"

    # Stories
    STORY_VIEW = "story:view"
    STORY_CREATE = "story:create"
    STORY_UPDATE = "story:update"
    STORY_DELETE = "story:delete"

    # Tasks
    TASK_VIEW = "task:view"
    TASK_CREATE = "task:create"
    TASK_UPDATE = "task:update"
    TASK_DELETE = "task:delete"

    # Users
    USER_VIEW = "user:view"
    USER_CREATE = "user:create"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"

    # Roles
    ROLE_VIEW = "role:view"
    ROLE_ASSIGN = "role:assign"
    ROLE_REMOVE = "role:remove"


ROLE_PERMISSIONS: dict[str, set[Permission]] = {
    "SUPER_USER": set(Permission),
    "PRODUCT_MANAGER": {
        Permission.BACKLOG_VIEW,
        Permission.BACKLOG_CREATE,
        Permission.BACKLOG_UPDATE,
        Permission.FEATURE_VIEW,
        Permission.FEATURE_CREATE,
        Permission.FEATURE_UPDATE,
        Permission.STORY_VIEW,
        Permission.STORY_CREATE,
        Permission.STORY_UPDATE,
        Permission.TASK_VIEW,
        Permission.USER_VIEW,
    },
    "DEVELOPER": {
        Permission.BACKLOG_VIEW,
        Permission.FEATURE_VIEW,
        Permission.STORY_VIEW,
        Permission.TASK_VIEW,
        Permission.TASK_UPDATE,
    },
}
