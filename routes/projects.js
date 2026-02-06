const express = require('express');
 const router = express.Router(); 
 const { getProjects, getProject, createProject, updateProject, deleteProject, deleteAllProjects } = require('../controllers/projectController');
  const { auth } = require('../middleware/auth'); 
  // All routes require authentication 
   router.use(auth); // Project routes
    router.route('/') .get(getProjects) .post(createProject) .delete(deleteAllProjects); router.route('/:id') .get(getProject) .put(updateProject) .delete(deleteProject); module.exports = router;