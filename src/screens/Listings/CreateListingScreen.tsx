import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    Image,
    Platform,
    Modal,
    KeyboardAvoidingView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { CreatePropertyListingRequest } from '../../types/propertyTypes';
import {
    PROPERTY_TYPES,
    HEATING_OPTIONS,
    COOLING_OPTIONS,
    PARKING_OPTIONS,
    LOT_UNITS,
    LotUnit
} from '../../types/propertyTypes';
import { useImagePicker } from '../../hooks/useImagePicker';

interface MediaItem {
    url: string;
    uri: string;
    type: 'image' | 'video';
    fileName?: string;
}

interface CreateListingScreenProps {
    navigation: any;
}

const CreateListingScreen: React.FC<CreateListingScreenProps> = ({ navigation }) => {
    const { pickAndUploadMedia, pickAndUploadDocument, uploading, uploadingDocument } = useImagePicker();

    const [formData, setFormData] = useState({
        propertyAddress: '',
        propertyType: '',
        yearBuilt: '',
        heatingSystems: [] as string[],
        coolingSystems: [] as string[],
        parking: [] as string[],
        price: '',
        bedrooms: '',
        bathrooms: '',
        lotSize: '',
        lotUnit: 'Acres' as LotUnit,
        squareFoot: '',
        description: '',
        networth: '',
        rehabEstimate: '',
        averageLeasePrice: '',
    });

    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [documentItems, setDocumentItems] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [dropdownModal, setDropdownModal] = useState<{ visible: boolean; type: string; options: string[]; isMulti: boolean }>({
        visible: false,
        type: '',
        options: [],
        isMulti: false
    });

    const MAX_IMAGES = 25;
    const MAX_VIDEOS = 1;

    // Calculate counts
    const imageCount = mediaItems.filter(item => item.type === 'image').length;
    const videoCount = mediaItems.filter(item => item.type === 'video').length;
    const canAddMoreImages = imageCount < MAX_IMAGES;
    const canAddMoreVideos = videoCount < MAX_VIDEOS;
    const canAddMoreMedia = canAddMoreImages || canAddMoreVideos;

    const handleAddMedia = async () => {
        if (!canAddMoreMedia) {
            Toast.show({
                type: 'error',
                text1: 'Limit Reached',
                text2: `Maximum ${MAX_IMAGES} images and ${MAX_VIDEOS} video reached`,
                position: 'top',
            });
            return;
        }

        try {
            const mediaResult = await pickAndUploadMedia();

            if (mediaResult) {
                // Check limits before adding
                if (mediaResult.type === 'image' && !canAddMoreImages) {
                    Toast.show({
                        type: 'error',
                        text1: 'Limit Reached',
                        text2: `Maximum ${MAX_IMAGES} images allowed`,
                        position: 'top',
                    });
                    return;
                }

                if (mediaResult.type === 'video' && !canAddMoreVideos) {
                    Toast.show({
                        type: 'error',
                        text1: 'Limit Reached',
                        text2: `Maximum ${MAX_VIDEOS} video allowed`,
                        position: 'top',
                    });
                    return;
                }

                setMediaItems(prev => [...prev, mediaResult]);
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Media uploaded successfully',
                    position: 'top',
                });
            }
        } catch (error) {
            console.error('Error uploading media:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to upload media. Please try again.',
                position: 'top',
            });
        }
    };

    const handleDocumentUpload = async () => {
        try {
            const documentResult = await pickAndUploadDocument();

            console.log('📄 Document upload result:', documentResult);

            if (documentResult) {
                setDocumentItems(prev => [...prev, documentResult]);
                console.log('✅ Document URL added to state:', documentResult);
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Document uploaded successfully',
                    position: 'top',
                });
            }
        } catch (error) {
            console.error('Error uploading document:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to upload document. Please try again.',
                position: 'top',
            });
        }
    };

    const removeMedia = (index: number) => {
        setMediaItems(prev => prev.filter((_, i) => i !== index));
    };

    const removeDocument = (index: number) => {
        setDocumentItems(prev => prev.filter((_, i) => i !== index));
    };

    const validateForm = (): boolean => {
        const validations = [
            { condition: !formData.propertyAddress.trim(), message: 'Please enter property address' },
            { condition: !formData.propertyType.trim(), message: 'Please select property type' },
            { condition: !formData.yearBuilt.trim(), message: 'Please enter year built' },
            { condition: !formData.heatingSystems.length, message: 'Please select heating systems' },
            { condition: !formData.coolingSystems.length, message: 'Please select cooling systems' },
            { condition: !formData.price.trim(), message: 'Please enter price' },
            { condition: !formData.bedrooms.trim(), message: 'Please enter number of bedrooms' },
            { condition: !formData.bathrooms.trim(), message: 'Please enter number of bathrooms' },
            { condition: !formData.parking.length, message: 'Please select parking options' },
            { condition: !formData.lotSize.trim(), message: 'Please enter lot size' },
            { condition: !formData.squareFoot.trim(), message: 'Please enter square footage' },
            { condition: !formData.description.trim(), message: 'Please enter description' },
            { condition: imageCount === 0, message: 'Please upload at least one image' },
        ];

        const failedValidation = validations.find(validation => validation.condition);
        if (failedValidation) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: failedValidation.message,
                position: 'top',
            });
            return false;
        }

        return true;
    };

    // NEW: Handle preview navigation instead of direct submission
    const handlePreviewListing = () => {
        if (!validateForm()) return;

        // Prepare data for preview screen
        const previewData = {
            formData,
            mediaItems,
            documentItems,
            imageCount,
            videoCount
        };

        console.log('📋 Navigating to preview screen with data');
        
        // Navigate to PreviewListingScreen with all the data
        navigation.navigate('PreviewListing', { listingData: previewData });
    };

    const updateFormData = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleMultiSelect = (type: 'heating' | 'cooling' | 'parking', value: string) => {
        setFormData(prev => {
            const key = type === 'parking' ? 'parking' : `${type}Systems`;
            const currentArray = prev[key] || [];

            const isSelected = currentArray.includes(value);
            const newArray = isSelected
                ? currentArray.filter(item => item !== value)
                : [...currentArray, value];

            return { ...prev, [key]: newArray };
        });
    };

    const openDropdownModal = (type: string, options: string[], isMulti: boolean = false) => {
        setDropdownModal({
            visible: true,
            type,
            options,
            isMulti
        });
    };

    const closeDropdownModal = () => {
        setDropdownModal({
            visible: false,
            type: '',
            options: [],
            isMulti: false
        });
    };

    const handleDropdownSelect = (value: string) => {
        if (dropdownModal.isMulti) {
            if (dropdownModal.type === 'heating') handleMultiSelect('heating', value);
            else if (dropdownModal.type === 'cooling') handleMultiSelect('cooling', value);
            else if (dropdownModal.type === 'parking') handleMultiSelect('parking', value);
        } else {
            if (dropdownModal.type === 'propertyType') updateFormData('propertyType', value);
            else if (dropdownModal.type === 'lotUnit') updateFormData('lotUnit', value);
            closeDropdownModal();
        }
    };

    const getSelectedOptionsText = (type: 'heating' | 'cooling' | 'parking') => {
        const key = type === 'parking' ? 'parking' : `${type}Systems`;
        const selected = formData[key] || [];

        if (selected.length === 0) {
            return `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        }

        return selected.length <= 2
            ? selected.join(', ')
            : `${selected.slice(0, 2).join(', ')} +${selected.length - 2}`;
    };

    const getSelectedValue = (type: string) => {
        switch (type) {
            case 'propertyType': return formData.propertyType;
            case 'heating': return formData.heatingSystems;
            case 'cooling': return formData.coolingSystems;
            case 'parking': return formData.parking;
            case 'lotUnit': return formData.lotUnit;
            default: return '';
        }
    };

    const isOptionSelected = (option: string) => {
        if (dropdownModal.isMulti) {
            const selected = getSelectedValue(dropdownModal.type);
            return Array.isArray(selected) && selected.includes(option);
        } else {
            return getSelectedValue(dropdownModal.type) === option;
        }
    };

    const renderDropdownButton = (
        name: string,
        placeholder: string,
        options: readonly string[],
        isMulti: boolean = false
    ) => {
        const selectedValue = getSelectedValue(name);

        return (
            <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => openDropdownModal(name, [...options], isMulti)}
            >
                <Text style={selectedValue && (Array.isArray(selectedValue) ? selectedValue.length > 0 : selectedValue) ? styles.dropdownTextFilled : styles.dropdownText}>
                    {isMulti
                        ? (Array.isArray(selectedValue) && selectedValue.length > 0
                            ? (selectedValue.length <= 2 ? selectedValue.join(', ') : `${selectedValue.slice(0, 2).join(', ')} +${selectedValue.length - 2}`)
                            : placeholder)
                        : (selectedValue || placeholder)
                    }
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Image
                        source={require('../../assets/icons/back.png')}
                        style={styles.backIcon}
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Listing</Text>
            </View>

            <KeyboardAvoidingView   
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.formContainer}
                    keyboardShouldPersistTaps="handled"
                >

                    {/* Upload Images Section */}
                    <View style={styles.uploadSection}>
                        <TouchableOpacity
                            style={styles.uploadBox}
                            onPress={handleAddMedia}
                            disabled={uploading || !canAddMoreMedia}
                        >
                            {uploading ? (
                                <ActivityIndicator size="large" color="#f97316" />
                            ) : (
                                <>
                                    <View style={styles.uploadIcon}>
                                        <Text style={styles.uploadIconText}>🖼️</Text>
                                    </View>
                                    <Text style={styles.uploadText}>Upload Images</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Add More Button */}
                        <TouchableOpacity
                            style={styles.addMoreButton}
                            onPress={handleAddMedia}
                            disabled={uploading}
                            activeOpacity={0.8}
                        >
                            <Image
                                source={require('../../assets/icons/plus.png')}
                                style={styles.plusIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.addMoreText}>Add More</Text>
                        </TouchableOpacity>

                        {/* Media Preview Grid */}
                        {mediaItems.length > 0 && (
                            <View style={styles.mediaGrid}>
                                {mediaItems.map((item, index) => (
                                    <View key={`${item.url}-${index}`} style={styles.mediaPreviewItem}>
                                        {item.type === 'image' ? (
                                            <Image source={{ uri: item.url }} style={styles.previewImage} />
                                        ) : (
                                            <View style={styles.videoThumbnail}>
                                                <Text style={styles.videoIcon}>🎥</Text>
                                            </View>
                                        )}
                                        <TouchableOpacity
                                            style={styles.removeMediaButton}
                                            onPress={() => removeMedia(index)}
                                        >
                                            <Text style={styles.removeIcon}>✕</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Location Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Location</Text>
                        <View style={styles.formGroup}>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your Address"
                                    placeholderTextColor="#9ca3af"
                                    value={formData.propertyAddress}
                                    onChangeText={(value) => updateFormData('propertyAddress', value)}
                                />
                                <TouchableOpacity style={styles.inputIconButton}>
                                    {/* <Text style={styles.inputIconText}>📍</Text> */}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Type */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Type</Text>
                        {renderDropdownButton('propertyType', 'Type', PROPERTY_TYPES, false)}
                    </View>

                    {/* Year Built */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Year Built</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Add a Built"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                                value={formData.yearBuilt}
                                onChangeText={(value) => updateFormData('yearBuilt', value)}
                            />
                            <TouchableOpacity style={styles.inputIconButton}>
                                <Text style={styles.inputIconText}>📅</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Heating */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Heating</Text>
                        {renderDropdownButton('heating', 'Add heating', HEATING_OPTIONS, true)}
                    </View>

                    {/* Cooling */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Cooling</Text>
                        {renderDropdownButton('cooling', 'Add Cooling', COOLING_OPTIONS, true)}
                    </View>

                    {/* Parking */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Parking</Text>
                        {renderDropdownButton('parking', 'Add Parking', PARKING_OPTIONS, true)}
                    </View>

                    {/* Price */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Price</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Add Price"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                                value={formData.price}
                                onChangeText={(value) => updateFormData('price', value)}
                            />
                        </View>
                    </View>

                    {/* Bedrooms */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Bedrooms</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Add Number of Bedrooms"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                                value={formData.bedrooms}
                                onChangeText={(value) => updateFormData('bedrooms', value)}
                            />
                        </View>
                    </View>

                    {/* Bathrooms */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Bathrooms</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Add Number of Bathrooms"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                                value={formData.bathrooms}
                                onChangeText={(value) => updateFormData('bathrooms', value)}
                            />
                        </View>
                    </View>

                    {/* Lot */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Lot</Text>
                        <View style={styles.lotContainer}>
                            <TextInput
                                style={styles.lotInput}
                                placeholder="Add Acres"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                                value={formData.lotSize}
                                onChangeText={(value) => updateFormData('lotSize', value)}
                            />
                        </View>
                    </View>

                    {/* SqFt */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>SqFt</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Add SqFt"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                                value={formData.squareFoot}
                                onChangeText={(value) => updateFormData('squareFoot', value)}
                            />
                        </View>
                    </View>

                    {/* Documents */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Documents</Text>
                        <TouchableOpacity
                            style={styles.documentUploadBox}
                            onPress={handleDocumentUpload}
                            disabled={uploadingDocument}
                        >
                            {uploadingDocument ? (
                                <ActivityIndicator size="large" color="#6b46c1" />
                            ) : (
                                <>
                                    <View style={styles.documentIconContainer}>
                                        <Text style={styles.documentIcon}>☁️</Text>
                                    </View>
                                    <Text style={styles.documentUploadText}>Upload files</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Document Preview */}
                        {documentItems.length > 0 && (
                            <View style={styles.documentsList}>
                                {documentItems.map((doc, index) => (
                                    <View key={index} style={styles.documentItem}>
                                        <View style={styles.documentPreview}>
                                            <Text style={styles.documentPreviewIcon}>📄</Text>
                                            <Text style={styles.documentName} numberOfLines={1}>
                                                {doc.split('/').pop() || 'Document'}
                                            </Text>
                                        </View>
                                        <TouchableOpacity 
                                            style={styles.removeDocButton}
                                            onPress={() => removeDocument(index)}
                                        >
                                            <Text style={styles.removeDocIcon}>✕</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Description */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Description</Text>
                        <View style={styles.textAreaContainer}>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Type here..."
                                placeholderTextColor="#9ca3af"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                value={formData.description}
                                onChangeText={(value) => updateFormData('description', value)}
                            />
                        </View>
                    </View>

                    {/* Preview Listing Button - NOW NAVIGATES TO PREVIEW SCREEN */}
                    <TouchableOpacity
                        style={[styles.previewButton, loading && styles.previewButtonDisabled]}
                        onPress={handlePreviewListing}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.previewButtonText}>PREVIEW LISTING</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Dropdown Modal */}
            <Modal
                visible={dropdownModal.visible}
                transparent
                animationType="slide"
                onRequestClose={closeDropdownModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                Select {dropdownModal.type.charAt(0).toUpperCase() + dropdownModal.type.slice(1)}
                            </Text>
                            <TouchableOpacity onPress={closeDropdownModal}>
                                <Text style={styles.closeModal}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalScrollView}>
                            {dropdownModal.options.map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.modalOption,
                                        isOptionSelected(option) && styles.modalOptionSelected
                                    ]}
                                    onPress={() => handleDropdownSelect(option)}
                                >
                                    <Text style={[
                                        styles.modalOptionText,
                                        isOptionSelected(option) && styles.modalOptionTextSelected
                                    ]}>
                                        {option} {isOptionSelected(option) && '✓'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        {dropdownModal.isMulti && (
                            <TouchableOpacity
                                style={styles.modalDoneButton}
                                onPress={closeDropdownModal}
                            >
                                <Text style={styles.modalDoneText}>Done</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>

            <Toast />
        </View>
    );
};

// Your existing styles remain the same...
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#f97316',
        paddingTop: Platform.OS === 'ios' ? 50 : 12,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        justifyContent: 'space-between',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    backButton: {
        padding: 4,
    },
    backIcon: {
        width: 24,
        height: 24,
        tintColor: '#fff',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        textAlign: "center",
        flex: 1,
        marginRight: 50
    },
    scrollView: {
        flex: 1,
    },
    formContainer: {
        padding: 16,
        paddingBottom: 132,
    },
    uploadSection: {
        marginBottom: 20,
    },
    uploadBox: {
        backgroundColor: '#e3e7eb',
        borderRadius: 18,
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        width: '77%',
        alignSelf: 'center',
    },
    uploadIcon: {
        width: 60,
        height: 60,
        backgroundColor: '#e5e7eb',
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    uploadIconText: {
        fontSize: 32,
    },
    uploadText: {
        fontSize: 18,
        color: '#6b7280',
        fontWeight: '500',
    },
    addMoreButton: {
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-end',
        marginVertical: 16,
    },
    plusIcon: {
        width: 30,
        height: 30,
        marginBottom: 4,
    },
    addMoreText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '400',
    },
    mediaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    mediaPreviewItem: {
        position: 'relative',
        width: 70,
        height: 70,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    videoThumbnail: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        backgroundColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    videoIcon: {
        fontSize: 24,
    },
    removeMediaButton: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeIcon: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 4,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        marginBottom: 10,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 25,
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        paddingVertical: 8,
        fontSize: 14,
        color: '#374151',
    },
    inputIconButton: {
        padding: 4,
    },
    inputIconText: {
        fontSize: 14,
        color: '#9ca3af',
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    dropdownText: {
        fontSize: 14,
        color: '#9ca3af',
    },
    dropdownTextFilled: {
        fontSize: 14,
        color: '#374151',
    },
    dropdownIcon: {
        fontSize: 14,
        color: '#9ca3af',
    },
    lotContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    lotInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 8,
        fontSize: 14,
        color: '#374151',
    },
    documentUploadBox: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#6b46c1',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    documentIconContainer: {
        width: 30,
        height: 30,
        backgroundColor: '#ede9fe',
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
        marginTop: 8
    },
    documentIcon: {
        fontSize: 24,
    },
    documentUploadText: {
        color: '#6b46c1',
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 8,
    },
    documentsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 12,
    },
    documentItem: {
        position: 'relative',
    },
    documentPreview: {
        width: 50,
        height: 50,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    documentPreviewIcon: {
        fontSize: 20,
    },
    documentName: {
        fontSize: 10,
        color: '#374151',
        marginTop: 4,
        textAlign: 'center',
        maxWidth: 50,
    },
    removeDocButton: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeDocIcon: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    textAreaContainer: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    textArea: {
        minHeight: 100,
        fontSize: 14,
        color: '#374151',
        textAlignVertical: 'top',
    },
    previewButton: {
        backgroundColor: '#f97316',
        borderRadius: 25,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        marginBottom: 16,
    },
    previewButtonDisabled: {
        opacity: 0.6,
    },
    previewButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
    },
    closeModal: {
        fontSize: 20,
        color: '#6b7280',
        fontWeight: 'bold',
    },
    modalScrollView: {
        maxHeight: 400,
    },
    modalOption: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalOptionSelected: {
        backgroundColor: '#fef3e2',
    },
    modalOptionText: {
        fontSize: 16,
        color: '#374151',
    },
    modalOptionTextSelected: {
        color: '#f97316',
        fontWeight: '500',
    },
    modalDoneButton: {
        backgroundColor: '#f97316',
        paddingVertical: 12,
        alignItems: 'center',
    },
    modalDoneText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CreateListingScreen;