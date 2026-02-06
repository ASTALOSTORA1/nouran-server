const Project = require('../models/Project');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.find({ userId: req.user._id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: projects.length,
            data: projects
        });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
    try {
        const { title, description, imageUrl } = req.body;

        const project = await Project.create({
            title,
            description,
            imageUrl,
            userId: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: project
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res) => {
    try {
        let project = await Project.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        project = await Project.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Project updated successfully',
            data: project
        });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        await project.deleteOne();

        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

// @desc    Delete all projects
// @route   DELETE /api/projects
// @access  Private
exports.deleteAllProjects = async (req, res) => {
    try {
        await Project.deleteMany({ userId: req.user._id });

        res.json({
            success: true,
            message: 'All projects deleted successfully'
        });
    } catch (error) {
        console.error('Delete all projects error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};