Categories (POST)
- Get name, color, budget from the body
- Create category in prisma
- Create category in redis
- Reply 201

Categories (:id) (PATCH)
- Get id from params
- Update category entry in prisma with request body
- Save newly created category to a variable
- Set category in cache to new category
- Send 200

Categories (:id) (GET)
- Get id from params
- Get category from cache
- If it is not null - return it with 200
- If it is, find category in prisma
- If it is null - return 404 as category does not exist
- If it is not, set category in cache
- Return it with 200
 