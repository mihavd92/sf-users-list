public with sharing class UserController {
    @AuraEnabled(cacheable=true)
    public static List<User> getUsers(String searchKey) {
        String searchQuery = '%' + (searchKey != null ? searchKey : '') + '%';
        return [SELECT Id, Name, Email, IsActive FROM User 
                WHERE Name LIKE :searchQuery 
                ORDER BY Name];
    }

    @AuraEnabled
    public static void updateUserStatus(Id userId, Boolean isActive) {
        try {
            User userToUpdate = [SELECT Id, IsActive FROM User WHERE Id = :userId LIMIT 1];
            userToUpdate.IsActive = isActive;
            update userToUpdate;
        } catch (Exception e) {
            throw new AuraHandledException('Помилка при оновленні користувача: ' + e.getMessage());
        }
    }
}
