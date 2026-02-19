
/**
 * Maps the application's Project State to Lark Base Fields.
 * 
 * @param {object} projectDetails - The state object from App.jsx
 * @returns {object} - The fields object formatted for Lark API
 */
export const mapProjectFields = (projectDetails) => {
    return {
        "ProjectType": projectDetails.projectType,
        "ProjectName": projectDetails.projectName,
        "Product ID": projectDetails.productId,
        // "Customer": projectDetails.customer, // Disabled as user requested: Contacts not yet set up
        "Training Name": projectDetails.trainingName,
        "Batch No": projectDetails.batchNo,
        "Trainee Dept": projectDetails.traineeDept,
        "CS ID": projectDetails.csId,
        "Project Status": projectDetails.projectStatus,
        "Invitation": projectDetails.invitation
    };
};

/**
 * Maps a single Schedule Day to Lark Base Fields.
 * 
 * @param {object} day - A single day object from the projectDays array
 * @param {number} index - The index of the day (0-based)
 * @param {string} projectRecordId - The ID of the parent Project record
 * @returns {object} - The fields object formatted for Lark API
 */
export const mapScheduleFields = (day, index, projectRecordId) => {
    // Helper to combine date + time into timestamp
    const getTimestamp = (dateStr, timeStr) => {
        if (!dateStr || !timeStr) return null;
        return new Date(`${dateStr}T${timeStr}:00`).getTime();
    };

    return {
        "DayNo": index + 1, // Number, not "Day X"
        "ID": [projectRecordId], // Link Field Name is 'ID'
        "TimeStart": getTimestamp(day.date, day.startTime),
        "TimeEnd": getTimestamp(day.date, day.endTime),
        "Sales Amount": parseFloat(day.salesAmount || 0),
        "Expected Payment Date": day.expectedPaymentDate ? new Date(day.expectedPaymentDate).getTime() : null,
        "Payment Status": day.paymentStatus
    };
};
