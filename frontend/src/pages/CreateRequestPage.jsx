import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Send, FileText, Receipt, Calendar, UserPlus,
    ChevronRight, Loader2, AlertCircle, CheckCircle,
    ArrowLeft, Building, Clock
} from 'lucide-react';
import api from '../api';

export default function CreateRequestPage() {
    const navigate = useNavigate();
    const [workflows, setWorkflows] = useState([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [formFields, setFormFields] = useState([]);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null);

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = () => {
        setLoading(true);
        // Use the main workflows endpoint as requested
        api.get('/workflows/?nopage=true')
            .then(res => {

                console.log('Workflows Response:', res.data); // Log for debugging
                
                // Handle both paginated and non-paginated responses
                let results = [];
                if (Array.isArray(res)) {
                    results = res;
                } else if (res.data && Array.isArray(res.data)) {
                    results = res.data;
                } else if (res.results && Array.isArray(res.results)) {
                    results = res.results;
                } else if (res.data && res.data.results && Array.isArray(res.data.results)) {
                    results = res.data.results;
                }
                
                // Map the results to ensure they have the structure we expect
                const transformed = results.map(rt => ({
                    id: rt.id,
                    name: rt.name,
                    request_name: rt.request_name || rt.name,
                    description: rt.description,
                    category: rt.category,
                    form_schema: rt.form_schema || [],
                    is_public: rt.is_public,
                    status: rt.status
                }));
                
                setWorkflows(transformed);
                if (transformed.length === 0) {
                    setError(null); // Keep error null but UI will show "No workflows available"
                }
            })
            .catch(err => {
                console.error('Failed to fetch workflows:', err);
                setError('Failed to load workflows. Please try again.');
            })
            .finally(() => setLoading(false));
    };

    const handleWorkflowChange = (workflowId) => {
        const workflow = workflows.find(w => w.id === workflowId);
        setSelectedWorkflow(workflow);
        setFormData({});
        setError(null);

        if (workflow && workflow.form_schema && workflow.form_schema.length > 0) {
            setFormFields(workflow.form_schema);
        } else {
            // Fetch form schema from API if not available
            api.get(`/workflows/${workflowId}/`)
                .then(res => {
                    const wf = res.data;
                    if (wf.form_schema && wf.form_schema.length > 0) {
                        setFormFields(wf.form_schema);
                    } else {
                        setFormFields([]);
                    }
                })
                .catch(err => {
                    console.error('Failed to fetch workflow details:', err);
                    setFormFields([]);
                });
        }
    };

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        // Validate required fields
        const missingFields = [];
        formFields.forEach(field => {
            if (field.required && !formData[field.name]) {
                missingFields.push(field.label);
            }
        });

        if (missingFields.length > 0) {
            setError(`Please fill in the following required fields: ${missingFields.join(', ')}`);
            setSubmitting(false);
            return;
        }

        try {
            console.log('Starting submission with data:', formData);
            const res = await api.post(`/workflows/${selectedWorkflow.id}/execute/`, {
                context: formData
            });

            console.log('Submission Result:', res);
            
            // The API interceptor unwraps response.data.data.
            // If we got here without throwing, it was likely successful.
            setSubmissionResult(res);
            setSuccess(true);
        } catch (err) {
            console.error('Submission Error:', err);
            setError('Failed to submit request: ' + (err || 'Unknown error'));
        } finally {
            setSubmitting(false);
        }
    };

    const getIconForCategory = (category) => {
        switch (category?.toLowerCase()) {
            case 'finance': return Receipt;
            case 'human resources':
            case 'hr': return Calendar;
            case 'operations': return Building;
            default: return FileText;
        }
    };

    // Success state
    if (success) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-surface rounded-2xl border border-white/10 p-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={40} className="text-success" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">Request Submitted!</h2>
                        <p className="text-textMuted mb-6">
                            Your {selectedWorkflow?.request_name || selectedWorkflow?.name} has been submitted successfully.
                        </p>

                        {submissionResult && (
                            <div className="bg-background/50 rounded-xl p-4 mb-6 text-left max-w-md mx-auto">
                                <p className="text-xs text-textMuted uppercase tracking-wider mb-3">Request Details</p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-textMuted">Request ID:</span>
                                        <span className="text-white font-mono">{submissionResult.data?.id?.slice(0, 8)}...</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-textMuted">Status:</span>
                                        <span className="text-warning font-medium capitalize">{submissionResult.data?.status || 'pending'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-textMuted">Type:</span>
                                        <span className="text-white">{selectedWorkflow?.request_name || selectedWorkflow?.name}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 max-w-md mx-auto">
                            <button
                                onClick={() => navigate('/')}
                                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all"
                            >
                                Go to Dashboard
                            </button>
                            <button
                                onClick={() => {
                                    setSuccess(false);
                                    setSelectedWorkflow(null);
                                    setFormData({});
                                    setFormFields([]);
                                    setSubmissionResult(null);
                                }}
                                className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all"
                            >
                                Create Another
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-2xl mx-auto">
                {/* Page Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-textMuted hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-white mb-2">Create Request</h1>
                    <p className="text-textMuted">Submit a new workflow request</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                        <AlertCircle size={20} className="text-red-400 mt-0.5" />
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

                {/* Form Card */}
                <div className="bg-surface rounded-2xl border border-white/10 p-6">
                    <form onSubmit={handleSubmit}>
                        {/* Workflow Selection Dropdown */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-textMuted mb-3">
                                Select Workflow <span className="text-red-400">*</span>
                            </label>
                            {loading ? (
                                <div className="py-2">
                                    <div className="flex items-center gap-2 text-textMuted text-sm">
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Loading available workflows...</span>
                                    </div>
                                </div>
                            ) : workflows.length === 0 ? (
                                <div className="py-8 text-center border border-dashed border-white/10 rounded-xl">
                                    <FileText size={32} className="mx-auto text-textMuted mb-2 opacity-50" />
                                    <p className="text-white font-medium">No workflows available</p>
                                    <p className="text-textMuted text-sm mt-1">Contact your administrator to set up request types.</p>
                                </div>
                            ) : (
                                <select 
                                    className="input-field w-full"
                                    value={selectedWorkflow?.id || ''}
                                    onChange={(e) => handleWorkflowChange(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Choose a request type...</option>
                                    {workflows.map(workflow => (
                                        <option key={workflow.id} value={workflow.id}>
                                            {workflow.request_name || workflow.name} ({workflow.category || 'General'})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Dynamic Form Fields */}
                        {selectedWorkflow && (
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                        <FileText size={16} className="text-primary" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">
                                        {selectedWorkflow.request_name || selectedWorkflow.name}
                                    </h3>
                                </div>

                                {formFields.length === 0 ? (
                                    <div className="py-6 text-center border border-dashed border-white/10 rounded-xl">
                                        <p className="text-textMuted">
                                            No additional information required. Click Submit to create your request.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {formFields.map(field => (
                                            <div key={field.name}>
                                                <label className="block text-sm font-medium text-textMuted mb-2">
                                                    {field.label}
                                                    {field.required && <span className="text-red-400 ml-1">*</span>}
                                                </label>
                                                {renderField(field)}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !selectedWorkflow}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Submit Request
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );

    function renderField(field) {
        const value = formData[field.name] || '';

        switch (field.type) {
            case 'textarea':
                return (
                    <textarea
                        className="input-field min-h-[120px]"
                        name={field.name}
                        value={value}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder || field.label}
                        required={field.required}
                    />
                );
            case 'select':
                return (
                    <select
                        className="input-field"
                        name={field.name}
                        value={value}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        required={field.required}
                    >
                        <option value="">Select {field.label}</option>
                        {(field.options || []).map(opt => (
                            <option key={opt.value || opt} value={opt.value || opt}>
                                {opt.label || opt}
                            </option>
                        ))}
                    </select>
                );
            case 'number':
                return (
                    <input
                        type="number"
                        className="input-field"
                        name={field.name}
                        value={value}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder || field.label}
                        required={field.required}
                    />
                );
            case 'email':
                return (
                    <input
                        type="email"
                        className="input-field"
                        name={field.name}
                        value={value}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder || field.label}
                        required={field.required}
                    />
                );
            case 'date':
                return (
                    <input
                        type="date"
                        className="input-field"
                        name={field.name}
                        value={value}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        required={field.required}
                    />
                );
            default:
                return (
                    <input
                        type="text"
                        className="input-field"
                        name={field.name}
                        value={value}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder || field.label}
                        required={field.required}
                    />
                );
        }
    }
}
