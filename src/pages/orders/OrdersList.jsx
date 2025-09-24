import { message } from "antd";
import React, { useEffect, useState } from "react";

function OrdersList() {
  const [rows, setRows] = useState([]);
  const fetchOrders = async () => {
    try {
      const { data } = await api.get(`/orders`);
      setRows(data.items || data);
      message.success("Fetch completed");
    } catch (error) {
      message.error("Fetch Orders failed");
    }
    useEffect(() => {
      fetchOrders();
    }, []);
    
  };
  return <div>{rows}</div>;
}

export default OrdersList;
