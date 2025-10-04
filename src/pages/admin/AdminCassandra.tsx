import React from 'react';
import AdminLayout from './AdminLayout';
import './AdminCassandra.css';

const AdminCassandra: React.FC = () => {
    return (
        <AdminLayout title="CASSANDRA Mascot">
            <div className="admin-cassandra-container">
                <div className="cassandra-content">
                    <div className="cassandra-image-container">
                        <div className="cassandra-display">
                            <div className="cassandra-header">
                                <h1>Cassandra</h1>
                                <p>The official mascot of Martyx Industries - your loyal companion in space exploration and innovation.</p>
                            </div>
                            <div className="cassandra-image-wrapper">
                                <img 
                                    src="/cassandra/Cassandra-life.png" 
                                    alt="Cassandra - Martyx Industries Mascot" 
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
