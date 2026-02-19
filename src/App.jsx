import { useState } from 'react';
import { Plus, Trash2, Calendar, Save, FileText, Clock, CreditCard, User, Building, Briefcase, Loader2 } from 'lucide-react';
import { larkService } from './services/larkService';
import { mapProjectFields, mapScheduleFields } from './config/larkMapping';

function App() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [projectDetails, setProjectDetails] = useState({
    projectType: 'In-House',
    projectName: '',
    productId: '',
    customer: '',
    trainingName: '',
    batchNo: '',
    traineeDept: '',
    csId: '',
    projectStatus: 'WIP',
    invitation: ''
  });

  const [projectDays, setProjectDays] = useState([
    {
      date: '',
      startTime: '09:00',
      endTime: '17:00',
      salesAmount: '',
      expectedPaymentDate: '',
      paymentStatus: 'รอชำระเงิน'
    }
  ]);

  const handleProjectChange = (e) => {
    const { name, value } = e.target;
    setProjectDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleDayChange = (index, e) => {
    const { name, value } = e.target;
    setProjectDays(prev => {
      const newDays = [...prev];
      newDays[index] = { ...newDays[index], [name]: value };
      return newDays;
    });
  };

  const addDay = () => {
    setProjectDays(prev => [...prev, {
      date: '',
      startTime: '09:00',
      endTime: '17:00',
      salesAmount: '',
      expectedPaymentDate: '',
      paymentStatus: 'รอชำระเงิน'
    }]);
  };

  const removeDay = (index) => {
    if (projectDays.length > 1) {
      setProjectDays(projectDays.filter((_, i) => i !== index));
    }
  };

  // DEBUG: Check Lark Fields
  const debugLarkFields = async () => {
    try {
      const appId = import.meta.env.VITE_LARK_APP_ID;
      const appSecret = import.meta.env.VITE_LARK_APP_SECRET;
      const appToken = import.meta.env.VITE_LARK_APP_TOKEN;

      const accessToken = await larkService.getTenantAccessToken(appId, appSecret);

      const projectTableId = import.meta.env.VITE_LARK_PROJECT_TABLE_ID;
      const scheduleTableId = import.meta.env.VITE_LARK_SCHEDULE_TABLE_ID;

      console.log("--- DEBUGGING LARK FIELDS ---");

      if (projectTableId) {
        console.log(`Fetching Fields for Project Table (${projectTableId})...`);
        const pFields = await larkService.getFields(accessToken, appToken, projectTableId);
        console.log("Project Fields:", pFields.map(f => `${f.field_name} (${f.type})`));
      }

      if (scheduleTableId) {
        console.log(`Fetching Fields for Schedule Table (${scheduleTableId})...`);
        const sFields = await larkService.getFields(accessToken, appToken, scheduleTableId);
        console.log("Schedule Fields:", sFields.map(f => `${f.field_name} (${f.type})`));
      }

      alert("Check Console for Field Names!");
    } catch (e) {
      console.error(e);
      alert("Debug Failed: " + e.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Config from Environment Variables
    const appId = import.meta.env.VITE_LARK_APP_ID;
    const appSecret = import.meta.env.VITE_LARK_APP_SECRET;
    const appToken = import.meta.env.VITE_LARK_APP_TOKEN;
    const projectTableId = import.meta.env.VITE_LARK_PROJECT_TABLE_ID;
    const scheduleTableId = import.meta.env.VITE_LARK_SCHEDULE_TABLE_ID;

    if (!appId || !appSecret) {
      alert("Missing App Config (App ID/Secret) in .env file.");
      return;
    }

    if (!scheduleTableId) {
      if (!confirm("You haven't set a Schedule Table ID. Schedule days will NOT be saved. Continue?")) return;
    }

    setIsSubmitting(true);
    try {
      // Use Tenant Access Token (Internal App)
      const accessToken = await larkService.getTenantAccessToken(appId, appSecret);

      // Create Project
      const projectFields = mapProjectFields(projectDetails);
      const projectRecord = await larkService.createRecord(accessToken, appToken, projectTableId, projectFields);

      console.log("PROJECT CREATED SUCCESSFULLY:", projectRecord);
      const projectId = projectRecord?.record_id || projectRecord?.id;
      if (!projectId) {
        console.error("ERROR: Project Created but no record_id found!", projectRecord);
        throw new Error("Failed to retrieve Project Record ID");
      }
      console.log("Project Record ID:", projectId);

      // Create Schedule
      if (scheduleTableId) {
        for (let i = 0; i < projectDays.length; i++) {
          const day = projectDays[i];
          const dayFields = mapScheduleFields(day, i, projectId);
          console.log(`Creating Schedule Day ${i + 1} with Fields:`, dayFields);
          await larkService.createRecord(accessToken, appToken, scheduleTableId, dayFields);
        }
      }

      console.log("SCHEDULE CREATED SUCCESSFULLY");
      alert(`Project "${projectDetails.projectName}" Created Successfully!`);

      // Reset Form
      setProjectDetails({
        projectType: 'In-House',
        projectName: '',
        productId: '',
        customer: '',
        trainingName: '',
        batchNo: '',
        traineeDept: '',
        csId: '',
        projectStatus: 'WIP',
        invitation: ''
      });
      setProjectDays([{
        date: '',
        startTime: '09:00',
        endTime: '17:00',
        salesAmount: '',
        expectedPaymentDate: '',
        paymentStatus: 'รอชำระเงิน'
      }]);

      alert("Submission Successful!");
      // Reset form or redirect? Keeping it simple for now.
    } catch (error) {
      console.error("Submission Error:", error);
      alert(`Submission Failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1"></div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Briefcase className="w-8 h-8 text-blue-600" />
            Project & Schedule Registration
          </h1>
          <p className="mt-2 text-gray-600">Enter project details and schedule information below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Project Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-blue-600 px-6 py-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-white" />
              <h2 className="text-lg font-semibold text-white">Project Information</h2>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Project Type <span className="text-red-500">*</span></label>
                <select
                  name="projectType"
                  value={projectDetails.projectType}
                  onChange={handleProjectChange}
                  className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="In-House">In-House</option>
                  <option value="Public">Public</option>
                  <option value="Consulting">Consulting</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Project Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="projectName"
                  value={projectDetails.projectName}
                  onChange={handleProjectChange}
                  className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter project name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Product ID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="productId"
                  value={projectDetails.productId}
                  onChange={handleProjectChange}
                  className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="PROD-001"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Customer (Disabled)</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-300" />
                  <input
                    type="text"
                    name="customer"
                    value={projectDetails.customer}
                    onChange={handleProjectChange}
                    disabled
                    className="w-full rounded-lg border-gray-200 border pl-10 p-2.5 text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                    placeholder="Search customer..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Training Name</label>
                <input
                  type="text"
                  name="trainingName"
                  value={projectDetails.trainingName}
                  onChange={handleProjectChange}
                  className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Batch No</label>
                <input
                  type="text"
                  name="batchNo"
                  value={projectDetails.batchNo}
                  onChange={handleProjectChange}
                  className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Trainee Dept</label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="traineeDept"
                    value={projectDetails.traineeDept}
                    onChange={handleProjectChange}
                    className="w-full rounded-lg border-gray-300 border pl-10 p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">CS ID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="csId"
                  value={projectDetails.csId}
                  onChange={handleProjectChange}
                  className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Project Status <span className="text-red-500">*</span></label>
                <select
                  name="projectStatus"
                  value={projectDetails.projectStatus}
                  onChange={handleProjectChange}
                  className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="WIP">WIP</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-gray-700">Invitation / Notes</label>
                <textarea
                  name="invitation"
                  value={projectDetails.invitation}
                  onChange={handleProjectChange}
                  rows="3"
                  className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Additional details..."
                ></textarea>
              </div>
            </div>
          </div>

          {/* Section 2: Dynamic Project Days */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-indigo-600 px-6 py-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-white" />
              <h2 className="text-lg font-semibold text-white">Project Schedule</h2>
            </div>

            <div className="p-6 space-y-6">
              {projectDays.map((day, index) => (
                <div key={index} className="relative bg-gray-50 rounded-lg p-6 border border-gray-200 transition-all hover:border-indigo-200">
                  <div className="absolute -top-3 left-4 bg-indigo-100 text-indigo-700 px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide">
                    Day {index + 1}
                  </div>

                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeDay(index)}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-full transition-colors"
                      title="Remove Day"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" /> Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={day.date || ''}
                        onChange={(e) => handleDayChange(index, e)}
                        className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" /> Time Range <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          name="startTime"
                          value={day.startTime || ''}
                          onChange={(e) => handleDayChange(index, e)}
                          className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value="">Start</option>
                          {Array.from({ length: 24 * 4 }).map((_, i) => {
                            const h = Math.floor(i / 4);
                            const m = (i % 4) * 15;
                            const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                            return <option key={time} value={time}>{time}</option>;
                          })}
                        </select>
                        <span className="text-gray-400">-</span>
                        <select
                          name="endTime"
                          value={day.endTime || ''}
                          onChange={(e) => handleDayChange(index, e)}
                          className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value="">End</option>
                          {Array.from({ length: 24 * 4 }).map((_, i) => {
                            const h = Math.floor(i / 4);
                            const m = (i % 4) * 15;
                            const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                            return <option key={time} value={time}>{time}</option>;
                          })}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Sales Amount (ยอดขาย) <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500 text-sm">฿</span>
                        <input
                          type="number"
                          name="salesAmount"
                          value={day.salesAmount}
                          onChange={(e) => handleDayChange(index, e)}
                          className="w-full rounded-lg border-gray-300 border pl-7 p-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <CreditCard className="w-4 h-4 text-gray-400" /> Expected Payment Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="expectedPaymentDate"
                        value={day.expectedPaymentDate}
                        onChange={(e) => handleDayChange(index, e)}
                        className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Payment Status <span className="text-red-500">*</span></label>
                      <select
                        name="paymentStatus"
                        value={day.paymentStatus}
                        onChange={(e) => handleDayChange(index, e)}
                        className={`w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-offset-1 ${day.paymentStatus === 'ชำระแล้ว'
                          ? 'bg-green-50 text-green-700 border-green-200 focus:ring-green-500'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200 focus:ring-yellow-500'
                          }`}
                      >
                        <option value="รอชำระเงิน">รอชำระเงิน (Pending)</option>
                        <option value="ชำระแล้ว">ชำระแล้ว (Paid)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addDay}
                className="w-full py-3 border-2 border-dashed border-indigo-300 rounded-lg text-indigo-600 font-medium hover:bg-indigo-50 hover:border-indigo-400 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Another Day
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:bg-gray-800 focus:ring-4 focus:ring-gray-300 transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Submit Registration
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
