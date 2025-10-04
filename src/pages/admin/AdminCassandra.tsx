import React from 'react';
import AdminLayout from './AdminLayout';
import './AdminCassandra.css';

const AdminCassandra: React.FC = () => {
    return (
        <AdminLayout title="CASSANDRA AI Assistant">
            <div className="admin-cassandra-container">
                <div className="cassandra-content">
                    <div className="cassandra-image-container">
                        <div className="cassandra-display">
                            <div className="cassandra-header">
                                <h1>Cassandra AI Assistant</h1>
                                <p>Your intelligent companion for managing Martyx Industries operations.</p>
                            </div>
                            <div className="cassandra-image-wrapper">
                                <img 
                                    src="/cassandra/Cassandra-life.png" 
                                    alt="Cassandra AI Assistant" 
                                    className="cassandra-image"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminCassandra;
