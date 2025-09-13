
export async function printToKitchen(orderHtml: string, printerEndpoint: string) {
  try {
    
    console.log('Printing to kitchen printer at:', printerEndpoint);
    console.log('Order content:', orderHtml);
    
   
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error('Error printing to kitchen:', error);
    throw error;
  }
}