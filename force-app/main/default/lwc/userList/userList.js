import { LightningElement, wire, track } from 'lwc';
import getUsers from '@salesforce/apex/UserController.getUsers';
import updateUserStatus from '@salesforce/apex/UserController.updateUserStatus';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class UserList extends LightningElement {
    @track users;             
    @track paginatedUsers;     
    @track error;
    @track currentPage = 1;    
    @track totalPages = 1;     
    recordsPerPage = 5;        
    perPageOptions = [
        { label: '5', value: '5' },
        { label: '10', value: '10' },
        { label: '20', value: '20' },
        { label: '50', value: '50' }
    ];
    searchKey = '';

    @wire(getUsers, { searchKey: '$searchKey' })
    wiredUsers({ error, data }) {
        if (data) {
            this.users = data.map(user => ({
                ...user,
                statusClass: user.IsActive ? 'active' : 'inactive',
                statusText: user.IsActive ? 'Active' : 'Inactive',
                buttonLabel: user.IsActive ? 'Deactivate' : 'Activate'
            }));
            this.error = undefined;
            this.updatePagination(); 
        } else if (error) {
            this.error = error.body.message;
            this.users = undefined;
        }
    }

    handleSearchKeyChange(event) {
        this.searchKey = event.target.value;
        this.currentPage = 1; 
        this.updatePagination();
    }

    get isPreviousDisabled() {
        return this.currentPage === 1;
    }

    get isNextDisabled() {
        return this.currentPage === this.totalPages;
    }

    handleButtonClick(event) {
        const userId = event.target.dataset.id;
        const isActive = event.target.dataset.isactive === 'true';
        this.handleStatusChange(userId, isActive);
    }

    handleStatusChange(userId, isActive) {
        const newStatus = !isActive;

        updateUserStatus({ userId: userId, isActive: newStatus })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Успіх',
                        message: `Користувача було ${newStatus ? 'активовано' : 'деактивовано'}.`,
                        variant: newStatus ? 'success' : 'warning'
                    })
                );
                this.users = this.users.map(user => {
                    if (user.Id === userId) {
                        return {
                            ...user,
                            IsActive: newStatus,
                            statusClass: newStatus ? 'active' : 'inactive',
                            statusText: newStatus ? 'Active' : 'Inactive',
                            buttonLabel: newStatus ? 'Deactivate' : 'Activate'
                        };
                    }
                    return user;
                });
                this.updatePagination();  
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Помилка',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }

    handleRecordsPerPageChange(event) {
        this.recordsPerPage = parseInt(event.detail.value, 10);
        this.currentPage = 1;  
        this.updatePagination();
    }

    handlePreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePagination();
        }
    }

    handleNextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updatePagination();
        }
    }

    updatePagination() {
        const startIdx = (this.currentPage - 1) * this.recordsPerPage;
        const endIdx = startIdx + this.recordsPerPage;
        this.paginatedUsers = this.users.slice(startIdx, endIdx);
        this.totalPages = Math.ceil(this.users.length / this.recordsPerPage);
    }
}
